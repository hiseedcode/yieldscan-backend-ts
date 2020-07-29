import 'reflect-metadata';
import { Service, Inject, Container } from 'typedi';
import { ApiPromise, WsProvider } from '@polkadot/api';
import config from '../config';
import { wait } from './utils';
import Logger from '../loaders/logger';
Container.set('config', config);

@Service()
export default class GetPolkaData {
  @Inject('config')
  config;
  async runCrawlers() {
    const api = await this.getPolkadotAPI();

    // logger.info('Running crawlers');
    // logger.info(this.config.crawlers)

    const crawlers = this.config.crawlers.filter((crawler) => crawler.enabled == 'true');
    // crawlers.forEach((crawler) => crawler.module.start(api));
    this.start(api, crawlers);
  }

  async start(api, crawlers) {
    // api.on('error', async () => {
    //   Logger.error('Error: API crashed');
    //   await api.dissconnect();
    //   process.exit(1);
    // });
    for (let i = 0; i < crawlers.length; i++) {
      await crawlers[i].module.start(api);
      await wait(5000);
    }
    Logger.info('wating 60 secs');
    await wait(60000);
    return this.start(api, crawlers);
  }

  async getPolkadotAPI() {
    const provider = new WsProvider(this.config.wsProviderUrl);
    provider.on('error', async () => {
      Logger.error('Error: API crashed');
      await provider.disconnect();
      process.exit(1);
    });
    const api = await ApiPromise.create({ provider });
    try {
      await api.isReady;
      Logger.info('API is ready!');
    } catch (error) {
      Logger.error('Error', error);
    }
    return api;
  }
}
