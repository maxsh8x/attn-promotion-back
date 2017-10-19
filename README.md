## Installation
### System requirements
```
MongoDB ≥ 3.4
Redis ≥ 3.0
```
### Node.js
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
nvm install stable
npm install -g yarn
```


### Development
```
cp config.template.json config.dev.json
yarn install
yarn run dev
```
### Production
```
cp config.template.json config.production.json
yarn install
yarn run build // after any code changes
yarn run start
```

## Deploy
```pm2 deploy ecosystem.config.js production```

## Monitoring
### Agenda
Use https://github.com/agenda/agendash

## Permissions

Each token (Authentication header) has one of following permission type:
### Root
- Read and write all questions.   

### Buchhalter
- Only read all questions.   

### Manager
- Only read own questions.   