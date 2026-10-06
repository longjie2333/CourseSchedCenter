const WECHAT_API = "https://api.weixin.qq.com";
const REQUEST_TIMEOUT = 10_000;

type WechatResponse = Record<string, unknown>;

type WechatTokenResponse = {
  access_token: string;
  expires_in: number; // 单位：秒
  errcode?: number;
}

export type SubscribeMessage = {
  openid: string;
  templateId: string;
  data: Record<string, { value: string }>;
};

export type OpenidResponse = {
  session_key: string;
  unionid: string;
  openid: string;
  errcode: number;
  errmsg: string;
};

export type SendMessageResponse = {
  errcode: number;
  errmsg: string;
};

export const WeChat = (appId: string, appSecret: string) => {
  async function request<T extends WechatResponse>(url: URL, init?: RequestInit,): Promise<T> {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    }).catch(() => {
      throw new Error("微信接口暂时无法访问");
    });

    if (!response.ok) {
      throw new Error(`微信接口请求失败（HTTP ${response.status}）`);
    }

    const body = await response.json().catch(() => {
      throw new Error("微信接口返回格式错误");
    });

    return body as T;
  }

  return {
    codeToOpenid: async (code: string): Promise<string> => {
      const url = new URL("/sns/jscode2session", WECHAT_API);
      url.searchParams.set("appid", appId);
      url.searchParams.set("secret", appSecret);
      url.searchParams.set("js_code", code);
      url.searchParams.set("grant_type", "authorization_code");

      const body = await request<OpenidResponse>(url);
      if (body.openid.length === 0) {
        throw new Error("登录凭证无效或已过期");
      }
      return body.openid;
    },

    sendSubscribeMessage: async (input: SubscribeMessage): Promise<WechatResponse> => {
      const tokenUrl = new URL("/cgi-bin/token", WECHAT_API);
      tokenUrl.searchParams.set("grant_type", "client_credential");
      tokenUrl.searchParams.set("appid", appId);
      tokenUrl.searchParams.set("secret", appSecret);

      const tokenBody = await request<WechatTokenResponse>(tokenUrl);
      if (tokenBody.access_token.length === 0) {
        throw new Error(`获取微信 access_token 失败（errcode ${tokenBody.errcode || 'unknown'}）`);
      }

      const messageUrl = new URL("/cgi-bin/message/subscribe/send", WECHAT_API);
      messageUrl.searchParams.set("access_token", tokenBody.access_token);

      const body = await request<SendMessageResponse>(messageUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          touser: input.openid,
          template_id: input.templateId,
          data: input.data,
          miniprogram_state: "formal",
          lang: "zh_CN",
        }),
      });

      const errcode = Number(body.errcode ?? 0);
      if (errcode !== 0) {
        throw new Error(`微信发送失败（errcode ${errcode}）`);
      }
      return body;
    },
  };
};
