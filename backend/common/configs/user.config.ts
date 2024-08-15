const CONFIG_USER = {
    verifyCodes: {
        length: 16
    },
    recommendation: {
        scoreList: {
            favorite: 30, // если keywords совпадают с фаворитами
            message: 25, // если keywords совпадают с сообщения по объявлениям
            search: 15, // если keywords совпадают с поисковыми запросами

            views: 5, // если keywords совпадают с просмотренными объявлениями
            category: {
                current: 10, // если объявления той же категории, что в истории
                parent: 5, // если объявления родительской категории, что в истории
                neighbour: 1, // если объявления соседней категории, что в истории
                sub: 0.5, // если объявление в дочерней категории

                _viewCountMultiplier: 0.2 // множитель на количество просмотров подходящей категории
            },

            city: 25, // если объявление из города пользователя
            radius: 15, // если объявления в радиусе checkLatLngRadius км от пользователя

            newest: 2, // если объявление создано за последние newestDate времени
            attention: 50 // если объявление важное (временно)
        },

        checkLatLngRadius: 100,
        newestDate: (60000 * 60 * 24 * 7)
    },

    maxExpiresDateForBan: 3600000 * 24 * 30 * 6,
    coolDownToSendModerationEmailCode: 1800000,

    coolDownToReportSimilar: 360000 * 24 * 2,
    coolDownToSupportCreate: 60000 * 5
}
export default CONFIG_USER