export const ROLES_ARRAY = ['root', 'buchhalter', 'manager']
export type ROLES_TYPE = 'root' | 'buchhalter' | 'manager'

export const sources = ['google', 'fb', 'yandex', 'vk', 'ok']
export const metagroups = ['ad', 'social', 'referral', 'internal', 'direct']
export const allSources = sources.concat(metagroups)
export const metricFields = ['pageviews', 'pageDepth', 'avgVisitDurationSeconds', 'bounceRate']

export const CHART_INTERVAL_ARRAY = ['days', 'months']
export type CHART_INTERVAL_TYPE = 'days' | 'months'

export const QUESTION_VARIANT_ARRAY = ['group', 'individual']
export type QUESTION_VARIANT_TYPE = 'group' | 'individual'

export const TRANSACTION_STATES_ARRAY = ['initial', 'pending', 'applied', 'done', 'canceling', 'canceled']
export type TRANSACTION_STATES_TYPE = 'initial' | 'pending' | 'applied' | 'done' | 'canceling' | 'canceled'
