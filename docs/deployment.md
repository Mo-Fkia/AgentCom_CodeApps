# Deployment

Development is done with the Mo-Fkia account.

Power Apps publishing must be done using the service account:

```text
australia-powerappsservice@cordonbleu.edu
```

Before publishing, build the Power Apps Code App:

```bash
npm run build
```

Then push the built app to Power Apps:

```bash
npx power-apps push
```

Do not store service account credentials in code, documentation, GitHub, or `.env` files.
