let MetaApi = require('metaapi.cloud-sdk').default;
let CopyFactory = require('metaapi.cloud-sdk').CopyFactory;

// your MetaApi API token
let token = process.env.TOKEN || '<put in your token here>';
// your provider MetaApi account id
// provider account must have PROVIDER value in copyFactoryRoles
let providerAccountId = process.env.PROVIDER_ACCOUNT_ID || '<put in your providerAccountId here>';
// your subscriber MetaApi account id
// subscriber account must have SUBSCRIBER value in copyFactoryRoles
let subscriberAccountId = process.env.SUBSCRIBER_ACCOUNT_ID || '<put in your subscriberAccountId here>';

const api = new MetaApi(token);
const copyfactory = new CopyFactory(token);

async function configureCopyFactory() {
  try {
    let providerMetaapiAccount = await api.metatraderAccountApi.getAccount(providerAccountId);
    if (!providerMetaapiAccount.copyFactoryRoles || !providerMetaapiAccount.copyFactoryRoles.includes('PROVIDER')) {
      throw new Error('Please specify PROVIDER copyFactoryRoles value in your MetaApi account in ' +
        'order to use it in CopyFactory API');
    }

    let subscriberMetaapiAccount = await api.metatraderAccountApi.getAccount(subscriberAccountId);
    if (!subscriberMetaapiAccount.copyFactoryRoles ||
      !subscriberMetaapiAccount.copyFactoryRoles.includes('SUBSCRIBER')) {
      throw new Error('Please specify SUBSCRIBER copyFactoryRoles value in your MetaApi account in ' +
        'order to use it in CopyFactory API');
    }

    let configurationApi = copyfactory.configurationApi;
    const strategies = await configurationApi.getStrategiesWithInfiniteScrollPagination();
    const strategy = strategies.find(s => s.accountId === providerMetaapiAccount.id);
    let strategyId;
    if (strategy) {
      strategyId = strategy._id;
    } else {
      strategyId = await configurationApi.generateStrategyId();
      strategyId = strategyId.id;
    }

    // create a strategy being copied
    await configurationApi.updateStrategy(strategyId, {
      name: 'Test strategy',
      description: 'Some useful description about your strategy',
      accountId: providerMetaapiAccount.id
    });

    // create subscriber
    await configurationApi.updateSubscriber(subscriberMetaapiAccount.id, {
      name: 'Test subscriber',
      subscriptions: [
        {
          strategyId: strategyId,
          multiplier: 1
        }
      ]
    });
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

configureCopyFactory();
