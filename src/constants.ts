export const ROLES_ARRAY = ['root', 'ofr']
export type ROLES_TYPE = 'root' | 'ofr'

export const metricNetworks = ['google', 'facebook', 'vk', 'instagram', 'odnoklassniki', 'yandex']
export const syntheticNetworks = ['ad', 'social', 'referral', 'internal', 'direct']
export const metricSources = metricNetworks.concat(syntheticNetworks)
export const metricFields = ['pageviews', 'pageDepth', 'avgVisitDurationSeconds', 'bounceRate']

export const CHART_INTERVAL_ARRAY = ['days', 'months']
export type CHART_INTERVAL_TYPE = 'days' | 'months'

export const QUESTION_VARIANT_ARRAY = ['group', 'related', 'individual']
export type QUESTION_VARIANT_TYPE = 'group' | 'related' | 'individual'
