/*
 * @Date: 2020-09-14 20:25:26
 * @LastEditors: 令和唯一
 * @LastEditTime: 2022-08-28 21:17:16
 */

import { Reader } from "protobufjs";
import { AcfunClient } from "../classes/AcfunClient";

const ProtoBufJs = require("protobufjs");
const ROOT = ProtoBufJs.Root.fromJSON(require("../protos.bundle.json"));

export async function StateHandler(buffer: Buffer, client: AcfunClient) {
  //console.log(buffer)
  const ZtLiveScStateSignal = ROOT.lookupType("ZtLiveScStateSignal");
  let items = ZtLiveScStateSignal.decode(buffer).item;
  items.forEach((element: { signalType: string; payload: any }) => {
    switch (element.signalType) {
      case "CommonStateSignalRecentComment":
        const CommonStateSignalRecentComment = ROOT.lookupType(
          "CommonStateSignalRecentComment"
        );
        let commnets = CommonStateSignalRecentComment.decode(element.payload);
        client.emit("recent-comment", commnets);
        break;
      case "CommonStateSignalDisplayInfo":
        const CommonStateSignalDisplayInfo = ROOT.lookupType(
          "CommonStateSignalDisplayInfo"
        );
        client.emit(
          "live-info",
          CommonStateSignalDisplayInfo.decode(element.payload)
        );
        break;
      case "CommonStateSignalTopUsers":
        const CommonStateSignalTopUsers = ROOT.lookupType(
          "CommonStateSignalTopUsers"
        );
        client.emit(
          "topuser-info",
          CommonStateSignalTopUsers.decode(element.payload)
        );
        break;
      case "CommonStateSignalCurrentRedpackList":
        const CommonStateSignalCurrentRedpackList = ROOT.lookupType(
          "CommonStateSignalCurrentRedpackList"
        );
        client.emit(
          "redpack-info",
          CommonStateSignalCurrentRedpackList.decode(element.payload)
        );
        break;
      case "AcfunStateSignalDisplayInfo":
        break;
      default:
        // const defaults = ROOT.lookupType(element.signalType);
        // client.emit(element.signalType, defaults.decode(element.payload));
        console.log("未知的和我懒得处理的signal:" + element.signalType);
        break;
    }
  });
}
