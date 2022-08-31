/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 18:16:33
 * @LastEditTime: 2022-08-31 18:14:46
 * @LastEditors: 令和唯一
 * @Description:
 * @FilePath: /ac-danmaku/classes/AcfunClient.ts
 * 关注嘉然,顿顿解馋
 */
import { EventEmitter } from "events";
import WebSocket from "websocket";
import proto from "../utils/proto";
import * as _ from "lodash";
import { CommandHandler } from "../handler/command.handler";
const ROOT = proto.getROOT();

export class AcfunClient extends EventEmitter {
  timer: null | NodeJS.Timer;
  retryCount: number;
  ticketIndex: number;
  heartbeatSeqId: number;
  sessionKey: string;
  connection: WebSocket.connection | null;
  seqId: number;
  instanceId: string;
  headerSeqId: number;
  did;
  visitorSt;
  acSecurity;
  userId;
  liveId;
  availiableTickets;
  enterRoomAttach;
  giftList;
  constructor(
    did: string,
    visitorSt: string,
    acSecurity: string,
    userId: string,
    liveId: string,
    availiableTickets: string[],
    enterRoomAttach: string,
    giftList: any
  ) {
    super();
    this.did = did;
    this.visitorSt = visitorSt;
    this.acSecurity = acSecurity;
    this.userId = userId;
    this.liveId = liveId;
    this.availiableTickets = availiableTickets;
    this.enterRoomAttach = enterRoomAttach;
    this.connection = null;
    this.seqId = 1;
    this.instanceId = "0";
    this.sessionKey = "";
    this.headerSeqId = 1;
    this.heartbeatSeqId = 1;
    this.ticketIndex = 0;
    this.retryCount = 0;
    this.timer = null;
    this.giftList = giftList;
    this.wsStart();
  }

  getGiftName = (giftId: string) => {
    const giftDetail = _.find(this.giftList, { giftId: giftId });
    return giftDetail;
  };

  sendBytes = (buffer: Buffer) => {
    if (this.connection) {
      this.connection.sendBytes(buffer);
      this.seqId++;
    } else console.log("ws->reconnect");
  };

  private decodeProcess = async (buffer: Buffer) => {
    const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    let header = proto.decodeHeader(buffer);
    if (header.encryptionMode == 1) this.processRegisterResponse(buffer);
    else {
      let decrypted = proto.decrypt(buffer, this.sessionKey);
      if (!decrypted) {
        return false;
      }
      let payload: any = DownstreamPayload.decode(decrypted);
      //console.log(payload)
      await CommandHandler(payload, this);
    }
  };

  private processRegisterResponse = (buffer: Buffer) => {
    const DownstreamPayload = ROOT.lookupType("DownstreamPayload");
    const RegisterResponse = ROOT.lookupType("RegisterResponse");
    let decrypted = proto.decrypt(buffer, this.acSecurity);
    let payload: any = decrypted && DownstreamPayload.decode(decrypted);
    let rr = payload && RegisterResponse.decode(payload.payloadData);
    this.instanceId = rr.instanceId;
    this.sessionKey = rr.sessKey.toString("base64");
    this.sendBytes(
      proto.genKeepAlivePack(
        this.seqId,
        this.instanceId,
        this.userId,
        this.sessionKey
      )
    );
    this.sendBytes(
      proto.genEnterRoomPack(
        this.seqId,
        this.instanceId,
        this.userId,
        this.sessionKey,
        this.enterRoomAttach,
        this.availiableTickets[this.ticketIndex],
        this.liveId
      )
    );
  };
  private wsStart = () => {
    var client = new WebSocket.client();

    client.on("connectFailed", function (error) {
      console.log("Connect Error: " + error.toString());
    });

    client.on("connect", (connection) => {
      console.log("WebSocket Client to Kuaishou Connected");
      this.connection = connection;
      let register = proto.genRegisterPack(
        this.seqId,
        this.instanceId,
        this.userId,
        this.acSecurity,
        this.visitorSt
      );
      this.sendBytes(register);
      this.connection.on("error", function (error) {
        console.log("Connection Error: " + error.toString());
      });
      this.connection.on("close", () => {
        console.warn("ws connection closed.");
        this.seqId = 1;
        this.emit("decode-error");
      });
      this.connection.on("message", async (message) => {
        //console.log(message)
        try {
          if (message.type === "binary") {
            if ((await this.decodeProcess(message.binaryData)) === false) {
              this.emit("decode-error");
            }
          }
        } catch (error) {
          console.log(error);
          this.connection && this.connection.close();
          this.connection = null;
          this.wsStart();
        }
      });
    });

    client.connect("wss://klink-newproduct-ws3.kwaizt.com/");
  };
}
