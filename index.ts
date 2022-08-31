/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 00:07:01
 * @LastEditTime: 2022-08-28 20:54:54
 * @LastEditors: 令和唯一
 * @Description:
 * @FilePath: /ac-danmaku/index.ts
 * 关注嘉然,顿顿解馋
 */
import { AcfunClient } from "./classes/AcfunClient";
import * as netHelper from "./utils/netHelper";

export const acFunDanmaku = async (
  author_id: string,
  option: { login: boolean; userinfo: any[] } = { login: false, userinfo: [] }
) => {
  const did = await netHelper.getDid();
  if (option.login) {
    if (!option.userinfo) {
      throw new Error("must pass userinfo by using login mode");
    }
    const login_info = await netHelper
      .userlogin(did, option.userinfo)
      .catch((err) => {
        console.log("userlogin error:" + err.message , JSON.stringify(err));
        return;
      });
    if (!login_info) return;
    const { visitorSt, userId, acSecurity } = login_info;
    const live_info = await netHelper
      .startPlayInfoByLogin(did, userId, visitorSt, author_id)
      .catch((err) => {
        console.log("startPlayInfoByLogin error:" + err.message , JSON.stringify(err));
        return;
      });
    if (!live_info) return;
    const availiableTickets = live_info["availableTickets"];
    const enterRoomAttach = live_info.enterRoomAttach;
    const liveId = live_info.liveId;
    const giftListRet = await netHelper
      .getGiftInfoList(did, userId, visitorSt, liveId, author_id, true)
      .catch((err) => {
        console.log("getGiftInfoList error:" + err.message , JSON.stringify(err));
        return;
      });
    return new AcfunClient(
      did,
      visitorSt,
      acSecurity,
      userId,
      liveId,
      availiableTickets,
      enterRoomAttach,
      giftListRet.giftList
    );
  } else {
    const login_info = await netHelper.visitorlogin(did).catch((err) => {
      console.log("visitorlogin error:" + err.message);
      return;
    });
    if (!login_info) return;
    const visitorSt = login_info.visitorSt;
    const userId = login_info.userId;
    const acSecurity = login_info.acSecurity;
    const live_info = await netHelper
      .startPlayInfoByVisitor(did, userId, visitorSt, author_id)
      .catch((err) => {
        console.log("startPlayInfoByVisitor error:" + err.message);
        return;
      });
    if (!live_info) return;
    const availiableTickets = live_info["availableTickets"];
    const enterRoomAttach = live_info.enterRoomAttach;
    const liveId = live_info.liveId;
    const giftListRet = await netHelper
      .getGiftInfoList(did, userId, visitorSt, liveId, author_id, false)
      .catch((err) => {
        console.log("getGiftInfoList error:" + err.message);
        return;
      });
    return new AcfunClient(
      did,
      visitorSt,
      acSecurity,
      userId,
      liveId,
      availiableTickets,
      enterRoomAttach,
      giftListRet.giftList
    );
  }
};
