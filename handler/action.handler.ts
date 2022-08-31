/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 19:55:46
 * @LastEditTime: 2022-08-28 20:02:48
 * @LastEditors: 令和唯一
 * @Description: 
 * @FilePath: /ac-danmaku/handler/action.handler.ts
 * 关注嘉然,顿顿解馋
 */
import { AcfunClient } from "../classes/AcfunClient";
import proto from "../utils/proto";
const ROOT = proto.getROOT();

export function ActionHandler(buffer: Buffer, client: AcfunClient) {
  const ZtLiveScActionSignal = ROOT.lookupType("ZtLiveScActionSignal");

  let item: any = ZtLiveScActionSignal.decode(buffer);
  let items: { signalType: any; payload: any[] }[] = item.item;
  items.forEach((element: { signalType: any; payload: any[] }) => {
    switch (element.signalType) {
      case "CommonActionSignalComment":
        const CommonActionSignalComment = ROOT.lookupType(
          "CommonActionSignalComment"
        );
        element.payload.forEach((e) => {
          let danmaku = CommonActionSignalComment.decode(e);
          client.emit("data", danmaku);
        });
        break;
      case "CommonActionSignalLike":
        const CommonActionSignalLike = ROOT.lookupType(
          "CommonActionSignalLike"
        );
        element.payload.forEach((e) => {
          let like = CommonActionSignalLike.decode(e);
          client.emit("like", like);
        });
        break;
      case "CommonActionSignalUserEnterRoom":
        const CommonActionSignalUserEnterRoom = ROOT.lookupType(
          "CommonActionSignalUserEnterRoom"
        );
        element.payload.forEach((e) => {
          let enters = CommonActionSignalUserEnterRoom.decode(e);
          client.emit("user-enter", enters);
        });
        break;
      case "CommonActionSignalUserFollowAuthor":
        const CommonActionSignalUserFollowAuthor = ROOT.lookupType(
          "CommonActionSignalUserFollowAuthor"
        );
        element.payload.forEach((e) => {
          client.emit("follow", CommonActionSignalUserFollowAuthor.decode(e));
        });
        break;
      case "AcfunActionSignalThrowBanana":
        const AcfunActionSignalThrowBanana = ROOT.lookupType(
          "AcfunActionSignalThrowBanana"
        );
        element.payload.forEach((e) => {
          client.emit("banana", AcfunActionSignalThrowBanana.decode(e));
        });
        break;
      case "CommonActionSignalGift":
        const CommonActionSignalGift = ROOT.lookupType(
          "CommonActionSignalGift"
        );
        element.payload.forEach((e) => {
          let giftDecode: any = CommonActionSignalGift.decode(e);
          giftDecode.value = giftDecode.value.toNumber();
          giftDecode.giftId = giftDecode.giftId.toNumber();
          const { giftName, webpPicList, pngPicList } = client.getGiftName(
            giftDecode.giftId
          );
          giftDecode.giftName = giftName;
          giftDecode.webpPicURL = webpPicList[0].url;
          giftDecode.pngPicURL = pngPicList[0].url;
          client.emit("gift", giftDecode);
        });
        break;
      case "AcfunActionSignalJoinClub":
        let AcfunActionSignalJoinClub = ROOT.lookupType(
          "AcfunActionSignalJoinClub"
        );
        element.payload.forEach((e) => {
          client.emit("join-club", AcfunActionSignalJoinClub.decode(e));
        });

        break;
      default:
        // const type = ROOT.lookupType(
        //   element.signalType
        // );
        console.log(element.signalType);
        break;
    }
  });
}
