import { DurableObject } from "cloudflare:workers";

export class Server extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.env = env;
    this.state = state;
    this.storage = state.storage;
    this.sessions = new Map();
    this.state.getWebSockets().forEach((webSocket) => {
      let meta = webSocket.deserializeAttachment();
      this.sessions.set(webSocket, { ...meta });
    });
  }

  getSocketByRole(role) {
    for (const [ws, session] of this.sessions.entries()) {
      if (session.role === role) return ws;
    }
    return null;
  }

  async fetch() {
    let pair = new WebSocketPair();

    await this.handleSession(pair[1]);

    return new Response(null, {
      status: 101,
      webSocket: pair[0],
      headers: {
        Upgrade: "websocket",
        Connection: "Upgrade",
      },
    });
  }

  async handleSession(ws) {
    this.state.acceptWebSocket(ws);

    let session = {};

    if (!this.getSocketByRole("mover")) {
      session.role = "mover";
      ws.serializeAttachment({ role: "mover" });
      this.sessions.set(ws, session);
      ws.send(JSON.stringify({ event: "role", data: "mover" }));
      return;
    }

    if (!this.getSocketByRole("pianist")) {
      session.role = "pianist";
      ws.serializeAttachment({ role: "pianist" });
      this.sessions.set(ws, session);
      ws.send(JSON.stringify({ event: "role", data: "pianist" }));
      return;
    }
  }

  async webSocketClose(ws) {
    this.sessions.delete(ws);
  }

  async webSocketError(ws, error) {
    this.sessions.delete(ws);
  }

  async webSocketMessage(ws, message, env) {
    const { event, data } = JSON.parse(message);
    const mover = this.getSocketByRole("mover");
    const pianist = this.getSocketByRole("pianist");

    switch (event) {
      case "note": {
        if (ws === pianist && mover) {
          mover.send(JSON.stringify({ event: "note", data }));
        }
        break;
      }
      case "location": {
        if (ws === mover && pianist) {
          pianist.send(JSON.stringify({ event: "location", data }));
        }
        break;
      }
    }
  }
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    let path = url.pathname.split("/");
    path.splice(0, 1);

    switch (path[0]) {
      case "room": {
        const room = path[1];
        const id = env.SERVER.idFromName(room);
        const stub = env.SERVER.get(id);
        return stub.fetch(req);
      }
      case "ws": {
        const room = path[1];
        if (!room) return new Response("Room required", { status: 400 });
        const id = env.SERVER.idFromName(room);
        const stub = env.SERVER.get(id);
        return stub.fetch(new Request(url.origin + "/room/" + room, req));
      }
      case "code": {
        const code = this.generateRoomCode();
        return new Response(code);
      }
      default: {
        return new Response("Not found", { status: 404 });
      }
    }
  },

  generateRoomCode() {
    let code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return code;
  },
};
