# feast-flaming-tongues

Feast of the Flaming Tongues — our very own group chilli festival.

A Node.js and TypeScript page for the 2027 feast. The date on the table is Saturday 28 August 2027, the August bank holiday weekend. The group has not settled the hour.

The house address and the guest page sit behind a login. The address is in `data/private.json`, which is not committed. The group password is stored only as a hash in `feast.env`.

```bash
npm install
npm run dev
```

The dev server listens on port 4173, or on `PORT` if that is set. Names added through the form are stored in `data/rsvps.json`.

On this machine the site runs from `compose.yaml`, the same pattern as ParaScript. On the LAN it is `http://lindeque-family-server:8090`. The Cloudflare tunnel should point the public hostname at `http://127.0.0.1:8090`. `TRUST_PROXY` is set in the compose file, so the login cookie is marked secure only when the request arrived through HTTPS. `feast.env` and `data/` are mounted, not built into the image. Compose would treat the `$` signs in the password hash as its own variables if that file were named `.env`.

```bash
docker compose up -d --build
```
