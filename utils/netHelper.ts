/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 18:32:51
 * @LastEditTime: 2022-08-28 20:55:33
 * @LastEditors: 令和唯一
 * @Description:
 * @FilePath: /ac-danmaku/utils/netHelper.ts
 * 关注嘉然,顿顿解馋
 */
import got from "got";
import cookie from "cookie";
import acConfig from "../config/common";
import acUrl from "../config/url_set";
import querystring from "querystring";

export const getDid = async () => {
  const res = await got(acUrl.acfun_login_main);
  let did_cookie = cookie.parse(res.headers["set-cookie"]![1]);
  return did_cookie._did;
};

export const visitorlogin = async (did: string) => {
  const res = await got("https://id.app.acfun.cn/rest/app/visitor/login", {
    method: "POST",
    headers: {
      cookie: "_did=" + did,
    },
    form: {
      sid: acConfig.acfun_visitor_sid,
    },
  });
  const resJson: {
    acSecurity: string;
    userId: string;
    result: number;
    "acfun.api.visitor_st": string;
  } = JSON.parse(res.body);
  if (resJson.result == 0) {
    return {
      acSecurity: resJson["acSecurity"],
      visitorSt: resJson["acfun.api.visitor_st"],
      userId: resJson["userId"],
    };
  }
  return;
};

export const userlogin = async (did: string, users: string[]) => {
  if (!Array.isArray(users)) {
    users = [users];
  }
  const user = users[Math.floor(Math.random() * 10000) % users.length];
  const res = await got(
    acUrl.acfunSignInURL + "?" + querystring.stringify({ user }, "&", "="),
    {
      headers: {
        cookie: "_did=" + did,
      },
      form: { user },
      method: "POST",
    }
  );
  const resJson = JSON.parse(res.body);
  if (resJson.result != 0) {
    throw new Error(JSON.stringify(resJson));
  }
  let acPasstoken = cookie.parse(res.headers["set-cookie"]![0]).acPasstoken;
  let auth_key = cookie.parse(res.headers["set-cookie"]![1]).auth_key;
  const resLogin = await got(
    "https://id.app.acfun.cn/rest/web/token/get?sid=acfun.midground.api",
    {
      method: "POST",
      headers: {
        cookie: `_did=${did};acPasstoken=${acPasstoken};auth_key=${auth_key}`,
      },
    }
  );
  const resLoginJson: {
    ssecurity: string;
    "acfun.midground.api_st": string;
    result: number;
    userId: string;
  } = JSON.parse(resLogin.body);
  if (resLoginJson.result == 0) {
    return {
      acSecurity: resLoginJson["ssecurity"],
      visitorSt: resLoginJson["acfun.midground.api_st"],
      userId: resLoginJson["userId"],
    };
  }
};

export const startPlayInfoByLogin = async (
  did: string,
  userId: string,
  apist: string,
  author_id: string
) => {
  const startPlayUrl =
    acUrl.acfun_kuaishou_zt_startplay +
    querystring.stringify(
      {
        subBiz: acConfig.kuaishou.subBiz,
        kpn: acConfig.kuaishou.kpn,
        userId: userId,
        did: did,
        kpf: acConfig.kuaishou.kpf,
        "acfun.midground.api_st": apist,
      },
      "&",
      "="
    );
  const res = await got(startPlayUrl, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + author_id,
    },
    form: {
      authorId: author_id,
      pullStreamType: "FLV",
    },
  });
  const resJson: {
    result: number;
    data: {
      liveId: string;
      availableTickets: string[];
      enterRoomAttach: string;
    };
  } = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(JSON.stringify(resJson));
  }
  return {
    liveId: resJson.data["liveId"],
    availableTickets: resJson.data["availableTickets"],
    enterRoomAttach: resJson.data["enterRoomAttach"],
  };
};

export const startPlayInfoByVisitor = async (
  did: string,
  userId: string,
  st: string,
  author_id: string
) => {
  const startPlayUrl =
    acUrl.acfun_kuaishou_zt_startplay +
    querystring.stringify(
      {
        subBiz: acConfig.kuaishou.subBiz,
        kpn: acConfig.kuaishou.kpn,
        userId: userId,
        did: did,
        kpf: acConfig.kuaishou.kpf,
        [acConfig.acfun_visitorSt_name]: st,
      },
      "&",
      "="
    );
  const res = await got(startPlayUrl, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + author_id,
    },
    form: {
      authorId: author_id,
      pullStreamType: "FLV",
    },
  });
  const resJson: {
    result: number;
    data: {
      liveId: string;
      availableTickets: string[];
      enterRoomAttach: string;
    };
  } = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(JSON.stringify(resJson));
  }
  return {
    liveId: resJson.data["liveId"],
    availableTickets: resJson.data["availableTickets"],
    enterRoomAttach: resJson.data["enterRoomAttach"],
  };
};

export const getGiftInfoList = async (
  did: string,
  userId: string,
  st: string,
  liveId: string,
  authorId: string,
  isLogin: boolean
) => {
  const getGiftInfoListURL =
    acUrl.get_kuaishou_zt_giftlist +
    querystring.stringify(
      {
        subBiz: acConfig.kuaishou.subBiz,
        kpn: acConfig.kuaishou.kpn,
        userId: userId,
        did: did,
        kpf: acConfig.kuaishou.kpf,
        [isLogin ? acConfig.acfun_userSt_name : acConfig.acfun_visitorSt_name]:
          st,
      },
      "&",
      "="
    );
  const res = await got(getGiftInfoListURL, {
    method: "POST",
    headers: {
      Referer: acUrl.acfun_live + authorId,
    },
    form: {
      visitorId: userId,
      liveId: liveId,
    },
  });
  const resJson = JSON.parse(res.body);
  if (resJson.result != 1) {
    throw new Error(JSON.stringify(resJson));
  }
  return resJson.data;
};
