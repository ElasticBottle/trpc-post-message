<div align="center">
  <h1>trpc-post-message</h1>
  <a href="https://www.npmjs.com/package/@elasticbottle/trpc-post-message"><img src="https://img.shields.io/npm/v/@elasticbottle/trpc-post-message.svg?style=flat&color=white" target="_blank" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-black" /></a>
  <a href="https://trpc.io/discord" target="_blank"><img src="https://img.shields.io/badge/chat-discord-blue.svg" /></a>
  <br />
  <hr />
</div>

⭐ **Help this repo out, STAR it!** ⭐

## **[Post Message](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage/) support for [tRPC](https://trpc.io/)** 📨

- Easy communication between iframes.
- Typesafe messaging between parent and child windows
- soon to be compatible with web workers

## Usage

**1. Install `trpc-post-message`.**

```bash
# npm
npm install trpc-post-message
# yarn
yarn add trpc-post-message
# pnpm
pnpm add trpc-post-message
```

**2. Add `createPostMessageHandler` in your background script.**

```typescript
// background.ts
import { initTRPC } from "@trpc/server";
import { createPostMessageHandler } from "trpc-post-message/adapter";

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
});

const appRouter = t.router({
  // ...procedures
});

export type AppRouter = typeof appRouter;

createPostMessageHandler({
  router: appRouter,
  postMessage: ({ message }) => window.postMessage(message, "your_targeted_url"),
  addEventListener: (listener) =>
    window.addEventListener("message", (e) => {
      if (e.origin !== 'your_whitelisted_domain') {
        return;
      }
      listener(e);
    }),
}); /* 👈 */,
```

**3. Add a `PostMessageLink` to the client in your content script.**

```typescript
// content.ts
import { createTRPCClient } from "@trpc/client";
import { PostMessageLink } from "trpc-post-message/link";

import type { AppRouter } from "./background";

export const PostMessageClient = createTRPCClient<AppRouter>({
  links: [
    PostMessageLink({
      postMessage: ({ message }) => window.postMessage(message, "your_targeted_url"),
      addEventListener: (listener) =>
        window.addEventListener("message", (e) => {
          if (e.origin !== 'your_whitelisted_domain') {
            return;
          }
          listener(e);
        }),
      removeEventListener: (listener) =>
        window.removeEventListener("message", listener),
    }),
  ], /* 👈 */,
});
```

## Requirements

Peer dependencies:

- [`tRPC`](https://github.com/trpc/trpc) Server v10 (`@trpc/server`) must be installed.
- [`tRPC`](https://github.com/trpc/trpc) Client v10 (`@trpc/client`) must be installed.

## Types

### PostMessageLinkOption

Please see [full typings here](src/link/index.ts).

| Property           | Type       | Description                                                                  | Required |
| ------------------ | ---------- | ---------------------------------------------------------------------------- | -------- |
| `postMessage`      | `Function` | Called to send data to the "server". You must send the `message` param as is | `true`   |
| `addEventListener` | `Function` | Called to add listener to receive request from the "server".                 | `true`   |

### CreatePostMessageHandlerOptions

Please see [full typings here](src/adapter/index.ts).

| Property           | Type       | Description                                                                  | Required |
| ------------------ | ---------- | ---------------------------------------------------------------------------- | -------- |
| `router`           | `Router`   | Your application tRPC router.                                                | `true`   |
| `postMessage`      | `Function` | Called to send data to the "client". You must send the `message` param as is | `true`   |
| `addEventListener` | `Function` | Called to add listener to receive request from the "client".                 | `true`   |
| `createContext`    | `Function` | Passes contextual (`ctx`) data to procedure resolvers.                       | `false`  |
| `onError`          | `Function` | Called if error occurs inside handler.                                       | `false`  |

---

## License

Distributed under the MIT License. See LICENSE for more information.

## Contact

Winston Yeo - Follow me on Twitter [@winston_yeo](https://twitter.com/winston_yeo) 💖

## Acknowledgements

Ths project would not have been possible without [@jlalmes](https://twitter.com/jlalmes) and his well-documented [trpc-chrome](https://github.com/jlalmes/trpc-chrome) package for which this code base was heavily built upon.
