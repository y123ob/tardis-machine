import { Filter, Exchange } from 'tardis-node'

// https://www.bitmex.com/app/wsAPI
const bitmexMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.op === 'subscribe'
  },

  map: (message: any) => {
    const args = typeof message.args === 'string' ? [message.args] : message.args

    return args.map((arg: string) => {
      const channelSymbols = arg.split(':')
      if (channelSymbols.length == 1) {
        return {
          channel: channelSymbols[0]
        }
      }
      return {
        channel: channelSymbols[0],
        symbols: [channelSymbols[1]]
      }
    })
  }
}

// https://docs.pro.coinbase.com/#protocol-overview
const coinbaseMaper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.type === 'subscribe'
  },

  map: (message: any) => {
    const topLevelSymbols = message.product_ids
    const finalChannels: Filter<any>[] = []

    const channelMappings = {
      full: ['received', 'open', 'done', 'match', 'change'],
      level2: ['snapshot', 'l2update'],
      matches: ['match', 'last_match'],
      ticker: ['ticker']
    }

    message.channels.forEach((channel: any) => {
      const channelName = typeof channel == 'string' ? channel : channel.name
      const symbols = typeof channel == 'string' ? topLevelSymbols : channel.product_ids
      const mappedChannels = (channelMappings as any)[channelName]

      mappedChannels.forEach((channel: string) => {
        finalChannels.push({
          channel,
          symbols
        })
      })
    })

    return finalChannels
  }
}

// https://docs.deribit.com/v2/#subscription-management
const deribitMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.method === 'public/subscribe'
  },

  map: (message: any) => {
    return message.params.channels.map((channel: string) => {
      const lastSeparator = channel.lastIndexOf('.')
      const firstSeparator = channel.indexOf('.')

      return {
        channel: channel.slice(0, firstSeparator),
        // handle both
        // "deribit_price_ranking.btc_usd" and "book.ETH-PERPETUAL.100.1.100ms" cases
        // we need to extract channel name and symbols out of such strings
        symbols: [channel.slice(firstSeparator + 1, lastSeparator == firstSeparator ? undefined : lastSeparator)]
      }
    })
  }
}

// https://www.cryptofacilities.com/resources/hc/en-us/sections/360000120914-Websocket-API-Public
const cryptofacilitiesMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.event == 'subscribe'
  },

  map: (message: any) => {
    return [
      {
        channel: message.feed,
        symbols: message.product_ids
      }
    ]
  }
}

// https://www.bitstamp.net/websocket/v2/
const bitstampMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.event == 'bts:subscribe'
  },

  map: (message: any) => {
    const separator = message.data.channel.lastIndexOf('_')
    return [
      {
        channel: message.data.channel.slice(0, separator),
        symbols: [message.data.channel.slice(separator + 1)]
      }
    ]
  }
}

// https://www.okex.com/docs/en/#spot_ws-sub
const okexMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.op == 'subscribe'
  },

  map: (message: any) => {
    return message.args.map((arg: string) => {
      const separator = arg.indexOf(':')
      return {
        channel: arg.slice(0, separator),
        symbols: [arg.slice(separator + 1)]
      }
    })
  }
}
// https://docs.ftx.com/#request-format
const ftxMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.op === 'subscribe'
  },

  map: (message: any) => {
    return [
      {
        channel: message.channel,
        symbols: [message.market]
      }
    ]
  }
}

// https://www.kraken.com/features/websocket-api#message-subscribe
const krakenMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.event === 'subscribe'
  },

  map: (message: any) => {
    return [
      {
        channel: message.subscription.name,
        symbols: message.pair
      }
    ]
  }
}
// https://lightning.bitflyer.com/docs?lang=en#json-rpc-2.0-over-websocket
const bitflyerMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.method === 'subscribe'
  },

  map: (message: any) => {
    const availableChannels = ['lightning_board_snapshot', 'lightning_board', 'lightning_ticker', 'lightning_executions']
    const inputChannel = message.params.channel as string
    const channel = availableChannels.find(c => inputChannel.startsWith(c))!
    const symbol = inputChannel.slice(channel.length + 1)

    return [
      {
        channel,
        symbols: [symbol]
      }
    ]
  }
}

// https://docs.gemini.com/websocket-api/#market-data-version-2
const geminiMapper: SubscriptionMapper = {
  canHandle: (message: any) => {
    return message.type === 'subscribe'
  },

  map: (message: any) => {
    const finalChannels: Filter<any>[] = []

    const channelMappings = {
      l2: ['trade', 'l2_updates', 'auction_open', 'auction_indicative', 'auction_result']
    }

    message.subscriptions.forEach((sub: any) => {
      const matchingChannels = (channelMappings as any)[sub.name]

      matchingChannels.forEach((channel: string) => {
        finalChannels.push({
          channel,
          symbols: sub.symbols
        })
      })
    })

    return finalChannels
  }
}

export const subscriptionsMappers: { [key in Exchange]?: SubscriptionMapper } = {
  bitmex: bitmexMapper,
  coinbase: coinbaseMaper,
  deribit: deribitMapper,
  cryptofacilities: cryptofacilitiesMapper,
  bitstamp: bitstampMapper,
  okex: okexMapper,
  ftx: ftxMapper,
  kraken: krakenMapper,
  bitflyer: bitflyerMapper,
  gemini: geminiMapper
}

export type SubscriptionMapper = {
  canHandle: (message: object) => boolean
  map: (message: object) => Filter<any>[]
}
