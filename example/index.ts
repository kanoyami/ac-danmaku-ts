/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 20:27:45
 * @LastEditTime: 2022-08-31 18:06:46
 * @LastEditors: 令和唯一
 * @Description: 
 * @FilePath: /ac-danmaku/example/index.ts
 * 关注嘉然,顿顿解馋
 */
import { acFunDanmaku } from "..";
acFunDanmaku("12648555").then((ac_client) => {
  if (ac_client) {
    ac_client.on("enter", () => {
      console.log("Enter room success!");
    });
    ac_client.on("recent-comment", (commmnets) => {
      //获得建立连接当前的弹幕列表
      console.log(commmnets);
    });
    ac_client.on("danmaku", (danmaku) => {
      //收到的弹幕
      console.log(danmaku);
    });

    ac_client.on("like", (like) => {
      //收到的zan
      console.log(like);
    });

    ac_client.on("gift", (gift) => {
      //收到的zan
      console.log(gift);
    });
  }
});
