import { Suspense } from "react"
import { getTweet, type Tweet, type TweetEntities } from "react-tweet/api"
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from "react-tweet"

// ---------------------------------------------------------------------------
// TEMPORARY WORKAROUND — remove this file once react-tweet ships a fix.
// Tracking: https://github.com/vercel/react-tweet/issues/218
//
// The Syndication API occasionally returns `entities` without one of the
// required arrays (hashtags, user_mentions, urls, symbols). `enrichTweet`
// spreads each of them with `[...]`, which throws "c is not iterable" during
// SSR. We fetch the tweet ourselves, fill in any missing arrays, and render
// with <EmbeddedTweet /> so `enrichTweet` always has iterables.
//
// To remove:
//   1. Delete this file.
//   2. In `components/mdx-remote.tsx`, re-import `Tweet` from "react-tweet"
//      and map `Tweet: (props) => <ReactTweet {...props} />` again.
// ---------------------------------------------------------------------------

function asEntityArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function normalizeTweetEntities(entities?: TweetEntities | null): TweetEntities {
  if (!entities || typeof entities !== "object" || Array.isArray(entities)) {
    return {
      hashtags: [],
      user_mentions: [],
      urls: [],
      symbols: [],
    }
  }

  const normalized: TweetEntities = {
    hashtags: asEntityArray(entities.hashtags),
    user_mentions: asEntityArray(entities.user_mentions),
    urls: asEntityArray(entities.urls),
    symbols: asEntityArray(entities.symbols),
  }

  const media = asEntityArray(entities.media)
  if (media.length > 0) {
    normalized.media = media
  }

  return normalized
}

function normalizeTweet(tweet: Tweet): Tweet {
  return {
    ...tweet,
    entities: normalizeTweetEntities(tweet.entities),
    ...(tweet.quoted_tweet
      ? {
          quoted_tweet: {
            ...tweet.quoted_tweet,
            entities: normalizeTweetEntities(tweet.quoted_tweet.entities),
          },
        }
      : {}),
    ...(tweet.parent
      ? {
          parent: {
            ...tweet.parent,
            entities: normalizeTweetEntities(tweet.parent.entities),
          },
        }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// End of workaround block.
// ---------------------------------------------------------------------------

interface MdxTweetProps {
  id: string
}

type FetchResult =
  | { ok: true; tweet: Tweet | undefined }
  | { ok: false; error: unknown }

async function fetchTweet(id: string): Promise<FetchResult> {
  try {
    return { ok: true, tweet: await getTweet(id) }
  } catch (error) {
    return { ok: false, error }
  }
}

async function TweetContent({ id }: MdxTweetProps) {
  const result = await fetchTweet(id)
  if (!result.ok) return <TweetNotFound error={result.error} />
  if (!result.tweet) return <TweetNotFound />
  return <EmbeddedTweet tweet={normalizeTweet(result.tweet)} />
}

export function MdxTweet({ id }: MdxTweetProps) {
  return (
    <Suspense fallback={<TweetSkeleton />}>
      <TweetContent id={id} />
    </Suspense>
  )
}
