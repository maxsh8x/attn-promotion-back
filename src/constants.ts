export const ROLES_ARRAY = ['root', 'ofr']
export type ROLES_TYPE = 'root' | 'ofr'

export const metricNetworks = ['google', 'facebook', 'vk', 'instagram', 'odnoklassniki', 'yandex']
export const syntheticNetworks = ['ad', 'social', 'referral', 'internal', 'direct']
export const metricSources = metricNetworks.concat(syntheticNetworks)
export const metricFields = ['pageviews', 'pageDepth', 'avgVisitDurationSeconds', 'bounceRate']
