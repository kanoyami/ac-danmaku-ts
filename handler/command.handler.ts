/*
 * @Date: 2020-09-15 14:52:17
 * @LastEditors: 令和唯一
 * @LastEditTime: 2022-08-31 18:21:01
 */
import { AcfunClient } from "../classes/AcfunClient";
import proto from "../utils/proto";
const ROOT = proto.getROOT();
import { StateHandler } from "./state.handler";
import { ActionHandler } from "./action.handler";
import { unzip } from "zlib";
import { promisify } from "util";
import { Reader } from "protobufjs";
const do_unzip = promisify(unzip);
export async function CommandHandler(
  payload: { command: string; payloadData: Uint8Array | Reader },
  client: AcfunClient
) {
  switch (payload.command) {
    case "Push.ZtLiveInteractive.Message":
      const ZtLiveScMessage = ROOT.lookupType("ZtLiveScMessage");
      const CompressionType = ROOT.lookupEnum(
        "ZtLiveScMessage.CompressionType"
      );
      client.sendBytes(
        proto.genPushMessagePack(
          client.seqId,
          client.instanceId,
          client.userId,
          client.sessionKey
        )
      );
      let ztPayload: any = ZtLiveScMessage.decode(payload.payloadData);
      let msg = ztPayload.payload;
      if (ztPayload.compressionType == CompressionType.values.GZIP)
        msg = await do_unzip(ztPayload.payload);
      switch (ztPayload.messageType) {
        case "ZtLiveScActionSignal":
          ActionHandler(msg, client);
          break;
        case "ZtLiveScStateSignal":
          StateHandler(msg, client);
          break;
        case "ZtLiveScNotifySignal":
          break;
        case "ZtLiveScStatusChanged":
          const ZtLiveScStatusChanged = ROOT.lookupType(
            "ZtLiveScStatusChanged"
          );
          const liveStateType = ROOT.lookupEnum("ZtLiveScStatusChanged.Type");
          let ztLiveScStatusChanged: any = ZtLiveScStatusChanged.decode(
            ztPayload.payload
          );
          if (
            ztLiveScStatusChanged.type == liveStateType.values.LIVE_CLOSED ||
            ztLiveScStatusChanged.type == liveStateType.values.LIVE_BANNED
          )
            console.log("live结束或者被Ban");
          break;
        case "ZtLiveScTicketInvalid":
          console.log("changeKey");
          client.ticketIndex =
            (client.ticketIndex + 1) / client.availiableTickets.length;
          client.sendBytes(
            proto.genEnterRoomPack(
              client.seqId,
              client.instanceId,
              client.userId,
              client.sessionKey,
              client.enterRoomAttach,
              client.availiableTickets[client.ticketIndex],
              client.liveId
            )
          );
          client.seqId++
        default:
          console.log("unkown message type:" + ztPayload.messageType);
          break;
      }
      break;
    case "Basic.KeepAlive":
      const KeepAliveResponse = ROOT.lookupType("KeepAliveResponse");
      let keepAliveResponse = KeepAliveResponse.decode(payload.payloadData);
      //todo 处理返回
      break;
    case "Basic.Ping":
      //todo
      break;
    case "Basic.Unregister":
      //todo
      break;
    case "Global.ZtLiveInteractive.CsCmd":
      const ZtLiveCsCmdAck = ROOT.lookupType("ZtLiveCsCmdAck");
      let ztLiveCsCmdAck: any = ZtLiveCsCmdAck.decode(payload.payloadData);
      switch (ztLiveCsCmdAck.cmdAckType) {
        case "ZtLiveCsEnterRoomAck":
          const ZtLiveCsEnterRoomAck = ROOT.lookupType("ZtLiveCsEnterRoomAck");
          let enterRoomAck: any = ZtLiveCsEnterRoomAck.decode(
            ztLiveCsCmdAck.payload
          );
          //发送进入事件
          client.emit("enter", enterRoomAck);
          let ms = enterRoomAck.heartbeatIntervalMs.toNumber()
            ? enterRoomAck.heartbeatIntervalMs.toNumber()
            : 1000;
          client.timer = setInterval(() => {
            client.sendBytes(
              proto.genHeartbeatPack(
                client.seqId,
                client.instanceId,
                client.userId,
                client.sessionKey,
                client.availiableTickets[client.ticketIndex],
                client.liveId
              )
            );
          }, ms);
          break;
        case "ZtLiveCsHeartbeatAck":
          break;
        case "ZtLiveCsUserExitAck":
          //todo
          break;
        default:
          console.log("这消息可能有点毛病");
          break;
      }
      break;
    case "Push.SyncSession":
      //todo
      break;
    case "Push.DataUpdate":
      //todo
      break;
    default:
      console.log("啊这，这消息是：" + payload.command);
      break;
  }
}
