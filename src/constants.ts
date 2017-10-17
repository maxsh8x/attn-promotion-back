export const ROLES_ARRAY = ['root', 'buchhalter', 'manager']
export type ROLES_TYPE = 'root' | 'buchhalter' | 'manager'

export const metricNetworks = ['google', 'fb', 'yandex', 'vk', 'ok']
export const syntheticNetworks = ['ad', 'social', 'referral', 'internal', 'direct']
export const metricSources = metricNetworks.concat(syntheticNetworks)
export const metricFields = ['pageviews', 'pageDepth', 'avgVisitDurationSeconds', 'bounceRate']

export const CHART_INTERVAL_ARRAY = ['days', 'months']
export type CHART_INTERVAL_TYPE = 'days' | 'months'

export const QUESTION_VARIANT_ARRAY = ['group', 'related', 'individual']
export type QUESTION_VARIANT_TYPE = 'group' | 'related' | 'individual'
