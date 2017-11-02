import axios from 'axios'

const config = {
  "port": 3000,
  "mongoDB": "mongodb://localhost/promotion",
  "agendaMongoDB": "mongodb://localhost/agenda",
  "redis": "redis://127.0.0.1:6379/1",
  "secret": "12345",
  "counterID": 41331339,
  "tokenOAuth": "AQAAAAAci-IiAASLj26aJjZ2FEGOg2OLi5H0wVs",
  "apiURL": "https://api-metrika.yandex.ru/stat/v1/data"
}

const dataSource = {
  "query": {
    "ids": [
      45560703
    ],
    "dimensions": [
      "ym:s:UTMSource",
      "ym:s:startURLPath",
      "ym:s:datePerioddayName"
    ],
    "metrics": [
      "ym:s:pageviews",
      "ym:s:pageDepth",
      "ym:s:avgVisitDurationSeconds",
      "ym:s:bounceRate"
    ],
    "sort": [
      "-ym:s:pageviews"
    ],
    "date1": "2017-10-01",
    "date2": "2017-11-01",
    "filters": "ym:s:startURLPath=='/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/'",
    "limit": 100,
    "offset": 1,
    "group": "day",
    "auto_group_size": "1",
    "quantile": "50",
    "offline_window": "21",
    "attribution": "Last",
    "currency": "RUB"
  },
  "data": [
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-11"
        }
      ],
      "metrics": [
        41,
        1.05128205,
        13.87179487,
        38.46153846
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-30"
        }
      ],
      "metrics": [
        38,
        1.1875,
        29.15625,
        37.5
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-07"
        }
      ],
      "metrics": [
        33,
        1.1,
        31.1,
        36.66666667
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-24"
        }
      ],
      "metrics": [
        31,
        1.55,
        109.1,
        30
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-29"
        }
      ],
      "metrics": [
        31,
        1.34782609,
        142.13043478,
        26.08695652
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-06"
        }
      ],
      "metrics": [
        29,
        1,
        28.51724138,
        27.5862069
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-08"
        }
      ],
      "metrics": [
        29,
        1.07407407,
        77.40740741,
        22.22222222
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-01"
        }
      ],
      "metrics": [
        28,
        1.2173913,
        24.30434783,
        34.7826087
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-09"
        }
      ],
      "metrics": [
        28,
        1.12,
        26,
        28
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-10"
        }
      ],
      "metrics": [
        28,
        1.03703704,
        38.33333333,
        33.33333333
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-02"
        }
      ],
      "metrics": [
        26,
        1.13043478,
        118.08695652,
        13.04347826
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-05"
        }
      ],
      "metrics": [
        26,
        1,
        30.26923077,
        50
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-27"
        }
      ],
      "metrics": [
        26,
        1.36842105,
        123.57894737,
        10.52631579
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-31"
        }
      ],
      "metrics": [
        26,
        1.23809524,
        133.38095238,
        28.57142857
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-12"
        }
      ],
      "metrics": [
        21,
        1.10526316,
        22.63157895,
        26.31578947
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-16"
        }
      ],
      "metrics": [
        21,
        1,
        11.66666667,
        42.85714286
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-13"
        }
      ],
      "metrics": [
        20,
        1.17647059,
        157.76470588,
        29.41176471
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-22"
        }
      ],
      "metrics": [
        20,
        1.33333333,
        115.86666667,
        20
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-11-01"
        }
      ],
      "metrics": [
        20,
        1,
        63.7,
        30
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-21"
        }
      ],
      "metrics": [
        19,
        1.26666667,
        49.4,
        20
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-23"
        }
      ],
      "metrics": [
        19,
        1.11764706,
        61.29411765,
        29.41176471
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-04"
        }
      ],
      "metrics": [
        17,
        1.13333333,
        58.86666667,
        40
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-20"
        }
      ],
      "metrics": [
        17,
        1,
        17.17647059,
        29.41176471
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-03"
        }
      ],
      "metrics": [
        16,
        1,
        25.8125,
        6.25
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-17"
        }
      ],
      "metrics": [
        16,
        1.06666667,
        40.93333333,
        40
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-25"
        }
      ],
      "metrics": [
        15,
        1.07142857,
        20.92857143,
        57.14285714
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-15"
        }
      ],
      "metrics": [
        13,
        1.08333333,
        6.25,
        58.33333333
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-18"
        }
      ],
      "metrics": [
        13,
        1.18181818,
        169.45454545,
        63.63636364
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-14"
        }
      ],
      "metrics": [
        12,
        1.09090909,
        68,
        9.09090909
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-19"
        }
      ],
      "metrics": [
        12,
        1.2,
        55.9,
        30
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-26"
        }
      ],
      "metrics": [
        11,
        1.1,
        45.9,
        30
      ]
    },
    {
      "dimensions": [
        {
          "name": "google"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-28"
        }
      ],
      "metrics": [
        10,
        1,
        8.8,
        60
      ]
    },
    {
      "dimensions": [
        {
          "name": "fb"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-03"
        }
      ],
      "metrics": [
        3,
        1,
        19,
        0
      ]
    },
    {
      "dimensions": [
        {
          "name": "fb"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-24"
        }
      ],
      "metrics": [
        3,
        1.5,
        184.5,
        50
      ]
    },
    {
      "dimensions": [
        {
          "name": "fb"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-02"
        }
      ],
      "metrics": [
        2,
        1,
        14,
        0
      ]
    },
    {
      "dimensions": [
        {
          "name": "fb"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-23"
        }
      ],
      "metrics": [
        2,
        1,
        8,
        50
      ]
    },
    {
      "dimensions": [
        {
          "name": "fb"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-08"
        }
      ],
      "metrics": [
        1,
        1,
        0,
        100
      ]
    },
    {
      "dimensions": [
        {
          "name": "fb"
        },
        {
          "name": "/questions/kakie-kosmicheskie-tekhnologii-est-v-nashem-dome-o-kotorykh-my-dazhe-ne-podozrevaem-/",
          "favicon": "the-answer.ru"
        },
        {
          "name": "2017-10-29"
        }
      ],
      "metrics": [
        1,
        1,
        16,
        0
      ]
    }
  ],
  "total_rows": 38,
  "total_rows_rounded": false,
  "sampled": false,
  "sample_share": 1,
  "sample_size": 4993,
  "sample_space": 4993,
  "data_lag": 47,
  "totals": [
    724,
    1.13125,
    57.1828125,
    31.875
  ],
  "min": [
    1,
    1,
    0,
    0
  ],
  "max": [
    41,
    1.55,
    184.5,
    100
  ]
}

// networks:

// { dimensions:
//    [ { name: 'google' },
//      { name: '2017-10-25' } ],
//   metrics: [ 1, 1, 148, 0 ] }

// meta:
// { dimensions:
//    [ { name: 'Переходы по рекламе',
//        icon_id: '3',
//        icon_type: 'traffic-source',
//        id: 'ad' },
//      { name: '2017-10-25' } ],
//   metrics: [ 1, 1, 148, 0 ] }

// total:
// { dimensions: [ { name: '2017-10-21' } ],
//   metrics: [ 1, 1, 17, 0 ] }

// Общее:
// dimension[0].name - dimension[0].id
// dimension[1].name - это дата

// последняя группировка

for (let i = 0; i < dataSource.data.length; i += 1) {
  const element = dataSource.data[i];
  console.log(element)
}

// async function getYMetricsByDay(startURLPath: string, counterID: number, startDate: string, endDate: string) {
//   const basicParams = {
//     ids: counterID,
//     date1: startDate,
//     date2: endDate,
//     filters: `ym:s:startURLPath=='${startURLPath}'`,
//     metrics: 'ym:s:pageviews,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:bounceRate',
//     dimensions: 'ym:s:datePeriod<group>Name',
//     group: 'day'
//   }
//   const networks = {
//     ...basicParams,
//     dimensions: [
//       'ym:s:UTMSource',
//       basicParams.dimensions
//     ].join(',')
//   }

//   const meta = {
//     ...basicParams,
//     dimensions: [
//       'ym:s:<attribution>TrafficSource',
//       basicParams.dimensions
//     ].join(',')
//   }

//   const axiosInstance = axios.create({
//     baseURL: config.apiURL,
//     params: {
//       oauth_token: config.tokenOAuth,
//       pretty: false
//     }
//   })

//   const { data: networksData } = await axiosInstance.get('', { params: networks })

//   const { data: metaData } = await axiosInstance.get('', { params: meta })
//   const { data: total } = await axiosInstance.get('', { params: basicParams })

//   const data: any = {}

//   const extractData = ([dataSource, fieldName]: [any, string]) => {
//     // dataSource.data.forEach(data => console.log(data))
//     for (let i = 0; i < dataSource.data.length; i += 1) {
//       const element = dataSource.data[i];
//       console.log(element)
//     }
//   }

//   const sourcesData = [
//     [networksData, 'name'],
//     // [metaData, 'id'],
//     // [total, 'total']
//   ]

//   sourcesData.forEach(extractData)
//   return data
// }


// (async () => {
//   const data = await getYMetricsByDay(
//     '/questions/chto-roditeli-raznykh-stran-mira-mogut-kupit-dlya-bezopasnosti-svoego-rebenka-za-500-rubley/',
//     41331339,
//     '2017-10-20',
//     '2017-10-31'
//   )
// })()
