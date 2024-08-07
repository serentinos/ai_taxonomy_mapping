# Taxonomy AI mapping

## How to install

- Install node with `nvm` [Link](https://sukiphan.medium.com/how-to-install-nvm-node-version-manager-on-macos-d9fe432cc7db)
- Open terminal inside of project folder and write `nvm use`

- Then run following commands 

```
npm i

npm run generate_folders
```


- Make a copy of file `env.example` and name it `.env`
- Open `.env` file and paste your OPEN AI key into `OPEN_API_KEY` field
- Paste your base taxonomy file into base_taxonomy folder


## How to use

```
npm run start -- --file-to-map-path="Your path to file that you want to map" --base-taxonomy-path="Path to your base taxonomy"
```

Example: 

```
npm run start -- --file-to-map-path="UPC_ Discount School Supply - taxonomy.csv" --base-taxonomy-path="base_taxonomy/UPC Taxonomy 2.5 - 2.5 Taxonomy (1).csv"
```

Generated mapped taxonomy will be in `mapped_taxonomies` folder


