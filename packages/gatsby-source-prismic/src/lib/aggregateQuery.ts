import * as prismic from 'ts-prismic'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import got from 'got'

import { Dependencies } from '../types'
import { QUERY_PAGE_SIZE } from '../constants'

import { buildQueryParams } from './buildQueryParams'
import { getRef } from './getRef'

/**
 * Recursively fetches all Prismic documents for a given set of Predicates.
 * Prismic's API is paginated so this function may make multiple network
 * requests for fetch all matching documents.
 *
 * @param predicates List of Predicates used to filter documents.
 * @param page Page to begin fetching.
 * @param docs Initial list of documents to which fetched documents will be appended.
 *
 * @return A list of documents matching the given Predicates.
 */
export const aggregateQuery = (
  predicates: string | string[] | null,
  page = 1,
  docs: prismic.Document[] = [],
): RTE.ReaderTaskEither<Dependencies, Error, prismic.Document[]> =>
  pipe(
    RTE.ask<Dependencies>(),
    RTE.bind('ref', () => getRef),
    RTE.bind('params', () => buildQueryParams),
    RTE.bind('url', (scope) =>
      RTE.right(
        prismic.buildQueryURL(
          scope.pluginOptions.apiEndpoint,
          scope.ref,
          predicates,
          { ...scope.params, page, pageSize: QUERY_PAGE_SIZE },
        ),
      ),
    ),
    RTE.bind('res', (scope) =>
      RTE.fromTaskEither(
        TE.tryCatch(
          () => got(scope.url).json() as Promise<prismic.Response.Query>,
          (error) => error as Error,
        ),
      ),
    ),
    RTE.bind('aggregateResults', (scope) =>
      RTE.right([...docs, ...scope.res.results]),
    ),
    RTE.chain((scope) =>
      page < scope.res.total_pages
        ? aggregateQuery(predicates, page + 1, scope.aggregateResults)
        : RTE.right(scope.aggregateResults),
    ),
  )