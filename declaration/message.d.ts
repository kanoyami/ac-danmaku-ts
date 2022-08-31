/*
 * @Author: 令和唯一
 * @Date: 2022-08-28 00:31:13
 * @LastEditTime: 2022-08-28 19:26:11
 * @LastEditors: 令和唯一
 * @Description: 
 * @FilePath: /ac-danmaku/declaration/message.d.ts
 * 关注嘉然,顿顿解馋
 */
export interface PacketHeader {
    appId: number;
    uid: string;
    instanceId: string;
    flags?: number;
    encodingType?: EncodingType;
    decodedPayloadLen: number;
    encryptionMode: EncryptionMode;
    tokenInfo?: TokenInfo;
    seqId: number;
    features: Feature[];
    kpn: string;
  }
  
  export enum Flags {
    kDirUpstream = 0,
    kDirDownstream = 1,
    kDirMask = 1,
  }
  
  export enum EncodingType {
    kEncodingNone = 0,
    kEncodingLz4 = 1,
  }
  
  export enum EncryptionMode {
    kEncryptionNone = 0,
    kEncryptionServiceToken = 1,
    kEncryptionSessionKey = 2,
  }
  
  export enum Feature {
    kReserve = 0,
    kCompressLz4 = 1,
  }
  
  
  export interface ZtLiveCsEnterRoom {
    isAuthor: boolean;
    reconnectCount: number;
    lastErrorCode: number;
    enterRoomAttach: string;
    clientLiveSdkVersion: string;
  }
  
  export interface ZtLiveCsEnterRoomAck {
    heartbeatIntervalMs: string;
  }
  
  