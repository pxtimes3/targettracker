# Contributing

1. Everything starts with the caliber. Add one if it's missing. Note the caliberId.
2. Add a bullet that has the correct caliberId. Note the bulletId.
3. Then add a cartridge (or multiple) with the correct bulletId.
4. ~~Run `npm run build`~~
5. Create a PR.
6. Once it is approved your new caliber/bulllet/cartidge now appears when you select a predefined manufacturer ammunition or create a new ammunuition entry.

## Calibers

Add directly to calibers.json and open a PR.
~~You can validate any changes with `npm validate-calibers`.~~

## Ammunition

Add your entries to the correct file (norma.json, hornady.json etc. Create one if it doesn't exist)~~ and run `npm run build`~~.

---

## TODO

- [ ] Working validation of files.
