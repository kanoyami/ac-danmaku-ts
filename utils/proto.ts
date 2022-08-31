/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 00:15:34
 * @LastEditTime: 2022-08-28 19:48:01
 * @LastEditors: 令和唯一
 * @Description:
 * @FilePath: /ac-danmaku/utils/proto.ts
 * 关注嘉然,顿顿解馋
 */
import protobufjs from "protobufjs";
import acConfig from "../config/common";
import { PacketHeader } from "../declaration/message";
import crypto from "crypto";
const ROOT = protobufjs.Root.fromJSON(require("../protos.bundle.json"));
const EncryptionMode = ROOT.lookupEnum("EncryptionMode");

export const base = {
  genCommand: (
    command: string,
    msg: Buffer,
    ticket: string,
    liveId: string
  ) => {
    const ZtLiveCsCmd = ROOT.lookupType("ZtLiveCsCmd");
    let payload = {
      cmdType: command,
      ticket: ticket,
      liveId: liveId,
      payload: msg,
    };
    let ztLiveCsCmd = ZtLiveCsCmd.create(payload);
    return Buffer.from(ZtLiveCsCmd.encode(ztLiveCsCmd).finish());
  },
  genPayload: (
    seqId: number,
    retryCount: number,
    command: string,
    msg?: Buffer
  ) => {
    const UpstreamPayload = ROOT.lookupType("UpstreamPayload");
    let payload = {
      command: command,
      payloadData: msg,
      seqId: seqId,
      retryCount: retryCount,
      subBiz: acConfig.kuaishou.subBiz,
    };
    let upstreamPayload = UpstreamPayload.create(payload);
    let buffer = UpstreamPayload.encode(upstreamPayload).finish();
    return buffer;
  },
  genHeader: (
    seqId: number,
    instanceId: string,
    uid: string,
    length: number,
    encryptionMode: number = EncryptionMode.values.kEncryptionSessionKey,
    token?: string
  ) => {
    const PacketHeaderPb = ROOT.lookupType("PacketHeader");

    let payload: PacketHeader = {
      tokenInfo: null,
      features: [],
      appId: acConfig.app_id,
      uid: uid,
      instanceId: instanceId,
      decodedPayloadLen: length,
      encryptionMode: encryptionMode,
      kpn: acConfig.kuaishou.kpn,
      seqId: seqId,
    };
    if (encryptionMode === EncryptionMode.values.kEncryptionServiceToken)
      payload["tokenInfo"] = { tokenType: 1, token: Buffer.from(token!) };
    let packetHeader = PacketHeaderPb.create(payload);
    let buffer = PacketHeaderPb.encode(packetHeader).finish();
    return buffer;
  },
  genEnterRoom: (enterRoomAttach: string) => {
    const ZtLiveCsEnterRoom = ROOT.lookupType("ZtLiveCsEnterRoom");
    let payload = {
      enterRoomAttach: enterRoomAttach,
      clientLiveSdkVersion: acConfig.client_live_sdk_version,
    };
    let ztLiveCsEnterRoom = ZtLiveCsEnterRoom.create(payload);
    return Buffer.from(ZtLiveCsEnterRoom.encode(ztLiveCsEnterRoom).finish());
  },
  genKeepAlive: () => {
    const KeepAliveRequest = ROOT.lookupType("KeepAliveRequest");
    const PresenceStatus = ROOT.lookupEnum("PresenceStatus");
    const ActiveStatus = ROOT.lookupEnum("ActiveStatus");
    let payload = {
      presenceStatus: PresenceStatus.values.kPresenceOnline,
    };
    let keepAliveRequest = KeepAliveRequest.create(payload);
    return Buffer.from(KeepAliveRequest.encode(keepAliveRequest).finish());
  },
  genRegister: (instanceId: string, uid: string) => {
    const RegisterRequest = ROOT.lookupType("RegisterRequest");
    const PlatformType = ROOT.lookupEnum("DeviceInfo.PlatformType");
    const PresenceStatus = ROOT.lookupEnum("RegisterRequest.PresenceStatus");
    const ActiveStatus = ROOT.lookupEnum("RegisterRequest.ActiveStatus");
    let payload = {
      appInfo: {
        appName: acConfig.app_name,
        sdkVersion: acConfig.sdk_version,
      },
      deviceInfo: {
        platformType: PlatformType.values.H5,
        deviceModel: "h5",
        imeiMd5: null,
      },
      presenceStatus: PresenceStatus.values.kPresenceOnline,
      appActiveStatus: ActiveStatus.values.kAppInForeground,
      instanceId: instanceId,
      ztCommonInfo: {
        kpn: acConfig.kuaishou.kpn,
        kpf: acConfig.kuaishou.kpf,
        uid: uid,
      },
    };
    let register = RegisterRequest.create(payload);
    let buffer = Buffer.from(RegisterRequest.encode(register).finish());
    // console.log("register object")
    // console.log(RegisterRequest.decode(buffer))
    return buffer;
  },
  genHeartbeat: (seqId: number) => {
    const ZtLiveCsHeartbeat = ROOT.lookupType("ZtLiveCsHeartbeat");
    let payload = {
      clientTimestampMs: new Date().getTime(),
      sequence: seqId,
    };
    let ztLiveCsHeartbeat = ZtLiveCsHeartbeat.create(payload);
    return Buffer.from(ZtLiveCsHeartbeat.encode(ztLiveCsHeartbeat).finish());
  },
  encode: (
    header: Uint8Array,
    body: any,
    key:
      | WithImplicitCoercion<string>
      | { [Symbol.toPrimitive](hint: "string"): string }
  ) => {
    const iv = crypto.randomBytes(16);
    let keyBuffer = Buffer.from(key, "base64");
    let cipher = crypto.createCipheriv("AES-128-CBC", keyBuffer, iv, {});
    cipher.setAutoPadding(true);
    let encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
    let headerSize = header.length;
    let bodySize = encrypted.length;
    let s1 = Buffer.from([0xab, 0xcd, 0x00, 0x01]);
    let s2 = Buffer.alloc(4);
    let s3 = Buffer.alloc(4);
    s2.writeInt32BE(headerSize);
    s3.writeInt32BE(bodySize + 16);
    let r = Buffer.concat([s1, s2, s3, header, iv, encrypted]);
    return r;
  },
};

export default {
  getROOT: ()=>{
    return ROOT
  },
  decrypt: (buffer: Buffer, key: string) => {
    try {
      let headersize = buffer.readInt32BE(4);
      let keyBuffer = Buffer.from(key, "base64");
      let ivBuffer = buffer.slice(12 + headersize, 28 + headersize);
      if (ivBuffer.length != 16) {
        return false;
      }
      let bodyBuffer = buffer.slice(28 + headersize);
      let decipher = crypto.createDecipheriv(
        "AES-128-CBC",
        keyBuffer,
        ivBuffer
      );
      return Buffer.concat([decipher.update(bodyBuffer), decipher.final()]);
    } catch (error) {
      console.log(error);
      return;
    }
  },
  decodeHeader: (buffer: Buffer) : any => {
    const PacketHeader = ROOT.lookupType("PacketHeader");
    let headersize = buffer.readInt32BE(4);
    let header = buffer.slice(12, 12 + headersize);
    return PacketHeader.decode(header);
  },
  genPushMessagePack: (
    seqId: number,
    instanceId: string,
    uid: string,
    key: string
  ) => {
    let payload = base.genPayload(seqId, 1, "Push.ZtLiveInteractive.Message");
    return base.encode(
      base.genHeader(seqId, instanceId, uid, payload.length),
      payload,
      key
    );
  },
  genHeartbeatPack: (
    seqId: number,
    instanceId: string,
    uid: string,
    key: string,
    ticket: string,
    liveId: string
  ) => {
    let heartbeatBody = base.genHeartbeat(seqId);
    let cmd = base.genCommand(
      "ZtLiveCsHeartbeat",
      heartbeatBody,
      ticket,
      liveId
    );
    let payload = base.genPayload(
      seqId,
      1,
      "Global.ZtLiveInteractive.CsCmd",
      cmd
    );
    return base.encode(
      base.genHeader(seqId, instanceId, uid, payload.length),
      payload,
      key
    );
  },
  genEnterRoomPack: (
    seqId: number,
    instanceId: string,
    uid: string,
    key: string,
    enterRoomAttach: string,
    ticket: string,
    liveId: string
  ) => {
    let enterRoom = base.genEnterRoom(enterRoomAttach);
    let enterRoomCmd = base.genCommand(
      "ZtLiveCsEnterRoom",
      enterRoom,
      ticket,
      liveId
    );
    let enterRoomBody = base.genPayload(
      seqId,
      1,
      "Global.ZtLiveInteractive.CsCmd",
      enterRoomCmd
    );
    let bodySize = enterRoomBody.length;
    return base.encode(
      base.genHeader(seqId, instanceId, uid, bodySize),
      enterRoomBody,
      key
    );
  },
  genRegisterPack: (
    seqId: number,
    instanceId: string,
    uid: string,
    key: string,
    token: string
  ) => {
    let register = base.genRegister(instanceId, uid);
    let registerBody = base.genPayload(seqId, 1, "Basic.Register", register);
    let bodySize = registerBody.length;
    return base.encode(
      base.genHeader(
        seqId,
        instanceId,
        uid,
        bodySize,
        EncryptionMode.values.kEncryptionServiceToken,
        token
      ),
      registerBody,
      key
    );
  },
  genKeepAlivePack: (
    seqId: number,
    instanceId: string,
    uid: string,
    key: string
  ) => {
    let keepAlive = base.genKeepAlive();
    let keepAliveBody = base.genPayload(seqId, 0, "Basic.KeepAlive", keepAlive);
    let bodySize = keepAliveBody.length;
    return base.encode(
      base.genHeader(seqId, instanceId, uid, bodySize),
      keepAliveBody,
      key
    );
  },
  /**
   * @argument buffer {Buffer}
   */
  // decodePackTest: (buffer, key) => {
  //   console.log(buffer.toString("hex"));
  //   //let keyBuffer = Buffer.from(key, "base64")
  //   const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
  //   const PacketHeader = ROOT.lookupType("PacketHeader");
  //   const RegisterResponse = ROOT.lookupType("RegisterResponse");
  //   let headersize = buffer.readInt32BE(4);
  //   let bodysize = buffer.readInt32BE(8);
  //   console.log("headerSize:" + headersize);
  //   console.log("bodysize:" + bodysize);
  //   let header = buffer.slice(12, 12 + headersize);
  //   let headerDecode = PacketHeader.decode(header);
  //   console.log(headerDecode);
  //   // let ivBuffer = buffer.slice(12 + headersize, 28 + headersize)
  //   // let bodyBuffer = buffer.slice(28 + headersize)
  //   // let decipher = crypto.createDecipheriv("AES-128-CBC", keyBuffer, ivBuffer)
  //   // let decryptedWithoutFinal = decipher.update(bodyBuffer)
  //   // let finalDe = decipher.final()
  //   // let decrypted = Buffer.concat([decryptedWithoutFinal, finalDe])
  //   console.log("decoudeSize:" + decrypted.toString("hex"));
  //   let payload = DownstreamPayload.decode(decrypted);

  //   let rr = RegisterResponse.decode(payload.payloadData);
  // },
};
