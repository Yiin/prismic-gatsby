import * as prismic from 'ts-prismic'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { pipe } from 'fp-ts/function'

import { Dependencies } from '../types'

/**
 * Build a query params argument for a Prismic request using the environment's
 * plugin options and state. If options like `lang` or `graphQuery` are set,
 * they are included in the response to ensure any API requests are properly
 * scoped.
 *
 * @returns Query params that can be used to query for documents.
 */
export const buildQueryParams: RTE.ReaderTaskEither<
  Dependencies,
  Error,
  prismic.QueryParams
> = pipe(
  RTE.ask<Dependencies>(),
  RTE.map((scope) => ({
    accessToken: scope.pluginOptions.accessToken,
    lang: scope.pluginOptions.lang,
    graphQuery: scope.pluginOptions.graphQuery,
    fetchLinks: scope.pluginOptions.fetchLinks,
  })),
)