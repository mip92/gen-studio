-- Fill narrationText (RU, ~5 sec each, first-person heroine monologue across
-- whole film), positiveEnvironment, positiveCharacterLocks, captionGenerator
-- for all 200 shots. Each shot gets a unique line tailored to what's on
-- screen + advancing the heroine's internal arc.

BEGIN;

-- ============================================================================
-- 1. narrationText — unique per shot, 1st-person conductor monologue
-- ============================================================================
WITH vo(code, txt) AS (VALUES
  -- A1 — Boarding (22)
  ('A1_SH01', 'Двенадцать лет. Один и тот же перрон. Сегодня — я встречаю его последний раз.'),
  ('A1_SH02', 'Первый билет смены. Кнопка идёт легко. Этот компостер старше меня на смене.'),
  ('A1_SH03', 'Их всегда сорок-пятьдесят за рейс. Сегодня — мои последние сорок-пятьдесят.'),
  ('A1_SH04', 'Я устала. Не от смены — от того, что осталась только она.'),
  ('A1_SH05', 'В кармане — конверт. Я его не открывала. Боюсь, что не передумаю.'),
  ('A1_SH06', 'Военный. Я их узнаю по тому, как они не смотрят в глаза.'),
  ('A1_SH07', 'Мать с ребёнком. Она ещё думает, что у неё всё впереди.'),
  ('A1_SH08', 'Невеста едет одна. У платья в чехле уже свой запах ожидания.'),
  ('A1_SH09', 'Мужчины с ноутбуками всегда опаздывают сами от себя. Я их понимаю.'),
  ('A1_SH10', 'Дед с орденами. На груди — три ряда. Без надписей. Я не спрашиваю.'),
  ('A1_SH11', 'Пара. Между ними три метра. И эти три метра — не пустые.'),
  ('A1_SH12', 'Музыкант. Гитара в чехле. Будет играть в тамбуре под утро.'),
  ('A1_SH13', 'Девочка одна. Семь лет. На платформе с ней — никого.'),
  ('A1_SH14', 'Её билет — мой последний. Маленький, как ладонь.'),
  ('A1_SH15', 'В ней что-то знакомое. Я отгоняю это — мне ещё работать.'),
  ('A1_SH16', 'Все вошли. Двери закрываются. Всегда легче, чем открываются.'),
  ('A1_SH17', 'Этот коридор я могу пройти с закрытыми глазами. И часто прохожу.'),
  ('A1_SH18', 'Стрелка дрогнула. Машинист дал ход. Мы поехали.'),
  ('A1_SH19', 'Колёса входят в ритм. Двенадцать лет один и тот же ритм.'),
  ('A1_SH20', 'Двенадцать лет я считаю чужие билеты. Сегодня — последний рейс.'),
  ('A1_SH21', 'Я не открываю его. Если открою — придётся подписать. А подписать — это уже совсем другое.'),
  ('A1_SH22', 'Мы уходим в закат. На той стороне меня никто не ждёт. И это — нормально.'),

  -- A2 — Settling (22)
  ('A2_SH01', 'Ночь приходит сразу. У поездов нет долгого вечера.'),
  ('A2_SH02', 'Он сидит так уже час. Не курил, не пил, не открывал багаж.'),
  ('A2_SH03', 'Я знаю это выражение. Так смотрят люди, которые откуда-то возвращаются.'),
  ('A2_SH04', 'Фотография в руках. Старая. Он её сложил и разложил уже двадцать раз.'),
  ('A2_SH05', 'Глаза не моргают на окно. Они моргают на что-то внутри.'),
  ('A2_SH06', 'Я приношу чай. Не спрашиваю — он не ответит. Просто ставлю.'),
  ('A2_SH07', 'Он кивает. Едва. Это всё, что нужно сказать.'),
  ('A2_SH08', 'Я киваю в ответ. Молчание — наша общая профессия.'),
  ('A2_SH09', 'Стакан качается в подстаканнике. Чай остынет. Мы оба знаем.'),
  ('A2_SH10', 'Я ухожу. Когда нужно — он позовёт. Не позовёт.'),
  ('A2_SH11', 'Через час позы те же. Чай не тронут. Хорошо.'),
  ('A2_SH12', 'Кулак сжат. Костяшки белые. Он держит что-то, чего я не вижу.'),
  ('A2_SH13', 'За окном — поля. Иногда — одинокая лампа. Он на них не смотрит.'),
  ('A2_SH14', 'Через два часа — один глоток. Этого достаточно.'),
  ('A2_SH15', 'Пар поднимается мимо щеки. Влага на ресницах. Может быть, от чая.'),
  ('A2_SH16', 'Фотография на столе. У всех есть свои фотографии. У меня — тоже.'),
  ('A2_SH17', 'Он прячет её. Аккуратно. Как кладут что-то очень важное.'),
  ('A2_SH18', 'Я прохожу мимо. Не оглядываюсь. Он знает, что я здесь.'),
  ('A2_SH19', 'Я узнаю его молчание. У меня такое же. Двенадцать лет в коридорах.'),
  ('A2_SH20', 'Двадцать три двенадцать. До рассвета — четырнадцать пассажиров и две ночи.'),
  ('A2_SH21', 'Поезд идёт сквозь поле. Луна за облаками. Все спят — кроме одного-двух.'),
  ('A2_SH22', 'Я возвращаюсь к себе. У меня тоже есть тишина. И она мне тоже нужна.'),

  -- A3 — Deep Night (25)
  ('A3_SH01', 'Глухая ночь. В это время поезд звучит громче всего.'),
  ('A3_SH02', 'В плацкарте — мать. Ребёнок не спит. И она не спит.'),
  ('A3_SH03', 'У неё ещё нет привычки быть взрослой. Это видно по тому, как она держит.'),
  ('A3_SH04', 'Маленькая ладонь вцепилась в её палец. Я помню, как это держит.'),
  ('A3_SH05', 'Она выходит в коридор — чтобы не будить остальных.'),
  ('A3_SH06', 'Идёт медленно. Качает. Я знаю эту походку — я её сама ходила.'),
  ('A3_SH07', 'Я смотрю на неё с дальнего конца коридора. Не подхожу — рано.'),
  ('A3_SH08', 'У меня была дочь. Это было давно. И это не отпускает.'),
  ('A3_SH09', 'Ребёнок заснул. Она ещё качает — по инерции, потому что забыла, как остановиться.'),
  ('A3_SH10', 'Она прислоняется лбом к стеклу. Тамбур холодный. Это её отрезвит.'),
  ('A3_SH11', 'Я приношу стул. Молча. Она кивает. Этого достаточно.'),
  ('A3_SH12', 'Благодарность не нужно произносить. Особенно в три часа ночи.'),
  ('A3_SH13', 'Я ухожу. У неё теперь есть стул. И это — всё, что у меня для неё есть.'),
  ('A3_SH14', 'В купе СВ — невеста. Платье висит на крюке. Без неё.'),
  ('A3_SH15', 'Кружево через пластик. Кто-то это выбирал. Кто-то покупал. Кому-то — было нужно.'),
  ('A3_SH16', 'Она смотрит в телефон. Экран гаснет. Никто не пишет. Никто не напишет.'),
  ('A3_SH17', 'На пальце след от кольца. Свежий. Сегодня сняла, наверное.'),
  ('A3_SH18', 'Слеза. Она не вытирает. Она её не замечает. Это лучшее состояние.'),
  ('A3_SH19', 'Я стою у её двери. Слушаю. Дверь приоткрыта. Не вхожу.'),
  ('A3_SH20', 'Тихо стучу. Один раз. Она не должна обернуться. И не оборачивается.'),
  ('A3_SH21', 'Она поворачивается к окну. Хорошо. Значит — справится сама.'),
  ('A3_SH22', 'Я опускаю руку. Не помогу. У меня нет таких слов.'),
  ('A3_SH23', 'За её окном — темнота. Одна далёкая лампа. Может быть, дом. Может быть, нет.'),
  ('A3_SH24', 'Она засыпает сидя. Под платьем. С красными глазами. Хорошо.'),
  ('A3_SH25', 'Тень платья на стене. Качается. Утром — будет ждать. Платье умеет.'),

  -- A4 — Pre-dawn (18)
  ('A4_SH01', 'Половина пятого. Самое одинокое время. Ночь ушла, утро ещё не пришло.'),
  ('A4_SH02', 'В купе — мужчина с ноутбуком. Он считает, что работает.'),
  ('A4_SH03', 'Сети нет уже три часа. Мы в полях. Он этого ещё не принял.'),
  ('A4_SH04', 'Он откидывается. Смотрит в потолок. Это первый честный жест за рейс.'),
  ('A4_SH05', 'Закрывает ноутбук. Медленно. Без злости. Просто закрывает.'),
  ('A4_SH06', 'На пальце — кольцо. Старое. Значит, есть к кому возвращаться.'),
  ('A4_SH07', 'Берёт чужую книгу. Сосед спит. Книга открыта посередине.'),
  ('A4_SH08', 'Начинает читать. По диагонали. Потом — внимательнее. Книга — не работа.'),
  ('A4_SH09', 'Я вижу его из коридора. Это хороший момент. Из тех, ради которых я ещё здесь.'),
  ('A4_SH10', 'Я почти улыбаюсь. Почти. У меня давно нет привычки.'),
  ('A4_SH11', 'Стакан, книга, лампа. Утро ещё не пришло. Но скоро.'),
  ('A4_SH12', 'Я делаю обход. Двенадцать лет — одинаковый обход. Сегодня — последний.'),
  ('A4_SH13', 'За окном — синева. Чуть теплее, чем час назад. Это и есть рассвет.'),
  ('A4_SH14', 'В тамбуре — дверь приоткрыта. Холодный воздух. Кто-то выходил.'),
  ('A4_SH15', 'Я открываю шире. Дышу. Холод выпрямляет. Мне это нужно.'),
  ('A4_SH16', 'Четыре тридцать восемь. До конечной — ещё двадцать часов. И — две жизни.'),
  ('A4_SH17', 'Мост через реку. Розовое небо. Это самый красивый момент маршрута.'),
  ('A4_SH18', 'Я стою в проёме. Лицом к рассвету. Это — для меня. Не для пассажиров.'),

  -- A5 — Daylight (30)
  ('A5_SH01', 'День приходит через окна. Берёзы строб в стекле. Я люблю эти полчаса.'),
  ('A5_SH02', 'Дед с орденами. С газетой. Я не спрашивала, куда. Он не спрашивал, кто я.'),
  ('A5_SH03', 'Профиль как медаль. Он на войне был. Видно по тому, как держит спину.'),
  ('A5_SH04', 'Ордена — три ряда. Без надписей. У него их больше, чем я могу сосчитать.'),
  ('A5_SH05', 'Он разворачивает пирог. Домашний. В тряпице. Я узнаю запах — у бабушки был такой.'),
  ('A5_SH06', 'Простой пирог. С яблоками. Без украшений. Так пекут — когда умеют.'),
  ('A5_SH07', 'Я приношу чай. Он ждал. Это не извинение. Это традиция.'),
  ('A5_SH08', 'Отламывает кусок. Протягивает мне. Я не отказываюсь — не имею права.'),
  ('A5_SH09', 'Беру двумя пальцами. Перчатки бы сняла — но не сниму. Этикет смены.'),
  ('A5_SH10', 'Кусаю. И закрываю глаза. Бабушкин пирог. У меня тоже была бабушка.'),
  ('A5_SH11', 'Он смотрит, как я ем. Без слов. Это благодарность. Его, мне, и обоих — кому-то выше.'),
  ('A5_SH12', 'За окном — берёзы и сарай. Сарай заброшен. Берёзы — нет.'),
  ('A5_SH13', 'Стакан с лимоном на фоне берёз. Я могу смотреть на это десять часов.'),
  ('A5_SH14', 'Он кладёт на стол фотографию. Чёрно-белую. Не показывает — просто кладёт.'),
  ('A5_SH15', 'Я не разглядываю. У всех есть свои фотографии. У меня тоже.'),
  ('A5_SH16', 'Я выхожу. Закрываю дверь. У нас обоих теперь есть, чем заняться.'),
  ('A5_SH17', 'В купе — двое. Между ними три метра. Это не три метра. Это три года.'),
  ('A5_SH18', 'Он не смотрит на неё. Он смотрит в окно. Это его право.'),
  ('A5_SH19', 'Она не смотрит на него. Она смотрит вниз. Это её право.'),
  ('A5_SH20', 'У него кольцо. У неё — нет. Что-то случилось. Когда-то и со мной.'),
  ('A5_SH21', 'Десять двенадцать. Они уже шесть часов так сидят. Шесть часов — это много.'),
  ('A5_SH22', 'Он держит книгу. Не читает. Страницы не переворачиваются. Книга — алиби.'),
  ('A5_SH23', 'Она наливает чай. Рука дрожит. Чай переливается.'),
  ('A5_SH24', 'Капли на подстаканнике. Она не вытерла. Они оба видели. Никто не сказал.'),
  ('A5_SH25', 'Она моргает. Медленно. Очень долго. Это секунда мира.'),
  ('A5_SH26', 'Он закрывает книгу. Кладёт её между ними. Это — жест. Я давно такие узнаю.'),
  ('A5_SH27', 'Она кладёт руку на книгу. Кончиками пальцев. Не глядя на него.'),
  ('A5_SH28', 'Его рука накрывает её. Без слов. Кольцо — против пустого пальца.'),
  ('A5_SH29', 'Она выдыхает. Впервые за шесть часов. Глаза ещё опущены — но уже не плачут.'),
  ('A5_SH30', 'Они сидят так же. Только теперь — соединены через книгу. Иногда этого хватает.'),

  -- A6 — Midpoint (18)
  ('A6_SH01', 'В тамбуре — мальчик с гитарой. Сидит на корточках. Поезд качает его.'),
  ('A6_SH02', 'Он играет медленно. Тихо. Не для пассажиров. Для движения.'),
  ('A6_SH03', 'Струны. Пальцы. Что-то простое. Я не запомню — но услышу позже, во сне.'),
  ('A6_SH04', 'Дверь тамбура открыта. Ветер. Волосы. Поле летит мимо.'),
  ('A6_SH05', 'Я стою в проёме. Слушаю. В мои обязанности не входит. Поэтому — слушаю.'),
  ('A6_SH06', 'Я закрываю глаза. На одну секунду. За смену это много. Это нарушение.'),
  ('A6_SH07', 'Он силуэтом — против открытой двери. Поле золотое. Я это запомню.'),
  ('A6_SH08', 'Он улыбается чему-то внутри. Не мне. Не для меня играет. Хорошо.'),
  ('A6_SH09', 'Поле. Столбы. Ни одного дома. Это самая красивая часть маршрута.'),
  ('A6_SH10', 'Последняя нота гаснет. Палец на струне. Тишина.'),
  ('A6_SH11', 'Я хлопаю. Один раз. Бесшумно. Он кивает. Я иду дальше.'),
  ('A6_SH12', 'По коридору. С улыбкой. Я не помню, когда была так.'),
  ('A6_SH13', 'Я останавливаюсь у её двери. Девочка играет с совой. Тихо. Сама себе.'),
  ('A6_SH14', 'Шепчет ей в ухо. Маленькая сова слушает. Видимо, привыкла.'),
  ('A6_SH15', 'У совы один глаз. Второй потерян. Тёмная нить торчит.'),
  ('A6_SH16', 'У моей дочери была такая. Точно такая. С одним глазом. Так и не починили.'),
  ('A6_SH17', 'Я достаю цепочку. На ней кольцо. Я не носила его на пальце уже семь лет.'),
  ('A6_SH18', 'Я отступаю от двери. Девочка не должна меня видеть такой.'),

  -- A7 — Crisis (35)
  ('A7_SH01', 'К полуночи начинается снег. Заряд. Локомотив теряет видимость.'),
  ('A7_SH02', 'Снег косой стеной. Окно белое. За ним — ничего.'),
  ('A7_SH03', 'Лампы мигнули. Машинист сбросил скорость. Это нормально.'),
  ('A7_SH04', 'Я заглядываю к ней. Девочка спит. Лоб блестит. Это не пот.'),
  ('A7_SH05', 'Щёки красные. Волосы влажные. Одеяло сползло.'),
  ('A7_SH06', 'Кладу ладонь на лоб. Горячо. Я знаю эту температуру.'),
  ('A7_SH07', 'Знаю как мать. Не как проводница. Между ними сейчас разница.'),
  ('A7_SH08', 'Достаю термометр. Старый, ртутный. Лучшего в этом поезде нет.'),
  ('A7_SH09', 'Жидкость высоко. Я не считаю. По глазу видно — много.'),
  ('A7_SH10', 'Я считала это много раз. Тогда — поздно. Сейчас — не успею второй раз.'),
  ('A7_SH11', 'Стучу к машинистам. Они спят. Они всегда спят в этот час.'),
  ('A7_SH12', 'Кулак о металл. Звук глухой. Поезд громче.'),
  ('A7_SH13', 'Возвращаюсь в коридор. Пустой. Никого. Все спят.'),
  ('A7_SH14', 'Я решаю быстро. Не потому что готова. Потому что больше некому.'),
  ('A7_SH15', 'Девочка стонет во сне. Тихо. Это её последнее тихое.'),
  ('A7_SH16', 'Сова упала на пол. Один глаз смотрит на меня.'),
  ('A7_SH17', 'У меня есть инструкция. Я её двенадцать лет соблюдала. Сегодня нарушу.'),
  ('A7_SH18', 'Иду в тамбур. Быстро. Без сомнений. Так ходят один раз в смену.'),
  ('A7_SH19', 'Стоп-кран. Красный. Пломба цела. Двенадцать лет я мимо неё ходила.'),
  ('A7_SH20', 'Пломба. Тонкая проволока. Если порвать — это уже не моя смена.'),
  ('A7_SH21', 'Я закрываю глаза. На две секунды. Этого хватает, чтобы дышать.'),
  ('A7_SH22', 'Перчатка обхватывает рукоять. Костяшки белеют. Как и на лбу у девочки.'),
  ('A7_SH23', 'Я открываю глаза. Решения больше нет. Есть только действие.'),
  ('A7_SH24', 'Тяну. Пломба рвётся. Звук маленький. А весит — двенадцать лет.'),
  ('A7_SH25', 'Поезд тормозит. Колёса дают искры. Снег вокруг светится.'),
  ('A7_SH26', 'Военный просыпается мгновенно. Он бы и сам нажал. Если бы знал.'),
  ('A7_SH27', 'Мать прижимает ребёнка. Сильнее. Это — инстинкт.'),
  ('A7_SH28', 'Невеста сидит. Платье качается. Она спокойна. Ей уже всё равно.'),
  ('A7_SH29', 'Бизнесмен в панике. Очки набок. Книга падает. Это смешно. И больно одновременно.'),
  ('A7_SH30', 'Дед спокоен. Уже видел всё. Сидит, ждёт. Хорошо, что он со мной.'),
  ('A7_SH31', 'Пара. Держатся за руки. Впервые с момента посадки. Я благодарна снегу.'),
  ('A7_SH32', 'Музыкант обнимает гитару. Не себя — гитару. Это иерархия любви.'),
  ('A7_SH33', 'Я иду по коридору. Никто не останавливает. Они знают — я знаю, что делаю.'),
  ('A7_SH34', 'Поднимаю её. Лёгкая. У детей с температурой кости становятся горячими.'),
  ('A7_SH35', 'За двенадцать лет я ни разу не нарушила правил. Один раз — стоит того.'),

  -- A8 — Resolution (30)
  ('A8_SH01', 'Поезд встал. В поле. Розовый рассвет. Тихо так, как бывает только после.'),
  ('A8_SH02', 'Снег. По обе стороны. До горизонта. Это самое чистое утро смены.'),
  ('A8_SH03', 'Скорая. По узкой дороге. Без сирены — мы уже не торопимся.'),
  ('A8_SH04', 'Я стою на ступеньке. Ребёнок на руках. Одеяло развевается.'),
  ('A8_SH05', 'Медики выходят. Двое. В куртках без надписей. Сельская скорая — лучшая.'),
  ('A8_SH06', 'Передаю её. Из своих рук — в чужие. Чужие теперь её.'),
  ('A8_SH07', 'Сова — в её ладошке. Подпрыгивает с шагом медика. Один глаз — на меня.'),
  ('A8_SH08', 'Я стою. Рука у груди. Цепочка горячая. Я её сейчас сниму.'),
  ('A8_SH09', 'Скорая отъезжает. Дорога одна. Они её знают. Утром доедут.'),
  ('A8_SH10', 'Я смотрю им вслед. Дыхание видно. Это её первый рассвет после.'),
  ('A8_SH11', 'Поезд снова едет. Через туман. К маленькой платформе без названия.'),
  ('A8_SH12', 'Платформа. Номер шесть. Города нет. Хорошо.'),
  ('A8_SH13', 'Я снимаю китель. Пуговица за пуговицей. Двенадцать лет — двадцать пуговиц.'),
  ('A8_SH14', 'Складываю. Аккуратно. Как всегда. Уже не для смены — для того, кто придёт после.'),
  ('A8_SH15', 'Конверт сверху. Двенадцать лет — внутри. Я его так и не открыла.'),
  ('A8_SH16', 'Цепочка рядом. Кольцо рядом. Они оба со мной уже не нужны.'),
  ('A8_SH17', 'Двенадцать лет — это очень долго. И очень коротко.'),
  ('A8_SH18', 'В рубашке. Без кителя. Без кепки. Я не узнаю себя — и это хорошо.'),
  ('A8_SH19', 'По коридору. К выходу. Самые лёгкие двенадцать шагов за смену.'),
  ('A8_SH20', 'Дверь открыта. За ней туман. За туманом поле. За полем — что-нибудь.'),
  ('A8_SH21', 'Я спускаюсь. Ступеньки скользкие. Они всегда скользкие. Я успеваю.'),
  ('A8_SH22', 'Оборачиваюсь. На него. Один раз. Чтобы не казалось, что убегала.'),
  ('A8_SH23', 'Иду в поле. Туман по колено. Дорога не видна. Я её придумаю.'),
  ('A8_SH24', 'Со стороны — точка в тумане. Это я. Снаружи я меньше, чем внутри.'),
  ('A8_SH25', 'В вагоне — новый проводник. Мужчина. Не знает, что произошло. Закрывает дверь.'),
  ('A8_SH26', 'Поезд уезжает. Без меня. Это нормально. Поезд всегда уезжает.'),
  ('A8_SH27', 'Внутри — молодая. Брюнетка. Свежая. Двенадцать лет ещё впереди — у неё.'),
  ('A8_SH28', 'Она проходит мимо купе. Девочки нет. Никого нет. Она не знает.'),
  ('A8_SH29', 'На сиденье — пуговица. Глаз совы. Маленький. Блестит.'),
  ('A8_SH30', 'Поезд идёт. Всегда идёт. Просто на следующем рейсе — буду уже не я. И — это нормально. Это всегда было нормально.')
)
UPDATE shots sh
SET "narrationText" = vo.txt
FROM vo
WHERE sh."shotCode" = vo.code
  AND sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift');

-- ============================================================================
-- 2. Per-shot positiveEnvironment, positiveCharacterLocks, captionGenerator,
--    plus per-shot continuity (no boilerplate)
-- ============================================================================
UPDATE shots sh
SET "promptFields" = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        sh."promptFields",
        '{positiveEnvironment}', to_jsonb(
          CASE sh."paletteKey"
            WHEN 'A1_sodium'       THEN 'Generic small Eastern European rural railway platform at autumn dusk, sodium vapor lamps casting warm orange pools on wet asphalt, single number sign visible no city name, no readable storefront text, no real brand logos, cool darkening sky above, distant tree line, weathered concrete edge, train carriage exterior to one side, photorealistic documentary atmosphere'
            WHEN 'A2_amber_indigo' THEN 'Long-distance Eastern European passenger train interior at first night, narrow corridor with warm tungsten amber ceiling lamps in long perspective, wood paneling on lower walls, neutral carpet, deep indigo darkness through carriage windows, no readable signs, no logos, generic ambiguous era'
            WHEN 'A3_amber_indigo' THEN 'Train interior at deep peak night, dimmer than evening, single reading lamps creating isolated pools of warm amber light, sleeping passenger silhouettes barely visible at edges, indigo windows fully dark with rare distant farm light flickering past, hush of bare train motion'
            WHEN 'A4_cool_blue'    THEN 'Train interior at pre-dawn hour, ceiling lamps still warm but starting to feel out of place, indigo windows now showing first faint hint of cool blue at horizon edge, weary tungsten reflecting on glass, no city in view, generic empty countryside'
            WHEN 'A5_cold_birch'   THEN 'Train interior in cold morning daylight, large windows showing rapidly passing birch trees creating strobing shadow pattern across the floor and walls, overcast high-key cool light, no readable signs, no logos, calm motorik rhythm of birch trunks'
            WHEN 'A6_golden_warm'  THEN 'Train interior in late afternoon golden warmth, long horizontal sunlight slanting through compartment windows, dust motes visible in the beams, long shadows down the corridor, warm but not hot, golden hour atmosphere'
            WHEN 'A7_dark_emerald' THEN 'Train interior during heavy second-night snow squall, dark emerald curtain shadows in compartments, harsh single sickly yellow emergency light in the vestibule, snow plastering against carriage windows in sideways drift, sense of mechanical groan and stress'
            WHEN 'A8_pink_fog'     THEN 'Train interior or small rural platform in pink dawn morning fog, milky diffused light from all directions with no harsh shadows, soft pink and pale grey palette, no city visible anywhere, snowy ground or low fog at platform level, ethereal calm after the storm'
            ELSE                        'Nameless Eastern European passenger train interior, no logos, no readable text, ambiguous era'
          END || CASE
            WHEN sh."isBroll" THEN ', detail and atmosphere shot without people, focus entirely on the environment object or landscape, no character identity required'
            ELSE ', subject framed against this environment with environmental tokens secondary to the character'
          END
        )
      ),
      '{positiveCharacterLocks}', to_jsonb(
        CASE
          WHEN sh."referenceProfileId" = 'CONDUCTOR_BASE' THEN 'CONDUCTOR_BASE LoRA identity locks: female 38-42, dark blonde low bun under navy peaked cap, grey-green tired eyes, thin scar above left eyebrow, dark navy uniform jacket with one shoulder stripe and brass buttons, white shirt collar, grey fingerless wool gloves; documentary skin texture, no makeup, no jewelry on hands; trigger token CONDUCTOR_BASE active; single-pass SDXL, NO hires-fix (preserves identity, see feedback_sdxl_hires_burns_lora)'
          WHEN sh."referenceProfileId" = 'PAX_MIL'   THEN 'PAX_MIL identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_01_military.png — 30yo man in plain dark green military shirt without insignia, short buzzcut, hollow cheeks, thousand-yard stare; no LoRA; identity weight ~0.8, no second IP-Adapter in this shot'
          WHEN sh."referenceProfileId" = 'PAX_MOM'   THEN 'PAX_MOM identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_02_mother_baby.png — 25yo woman with long dark hair loose, cream cardigan, exhausted gentle face; no LoRA; identity weight ~0.8, no second IP-Adapter'
          WHEN sh."referenceProfileId" = 'PAX_BRIDE' THEN 'PAX_BRIDE identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_03_bride.png — 24yo woman, light brown messy ponytail, no makeup, grey hoodie, red-rimmed eyes; no LoRA; identity weight ~0.8, no second IP-Adapter'
          WHEN sh."referenceProfileId" = 'PAX_BIZ'   THEN 'PAX_BIZ identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_04_businessman.png — 45yo man, rumpled white shirt, loose dark tie, salt-pepper receding hair, defeated; no LoRA; identity weight ~0.8'
          WHEN sh."referenceProfileId" = 'PAX_VET'   THEN 'PAX_VET identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_05_veteran.png — 80yo man, dark wool blazer with generic medal ribbons, bald with thin white side hair, pale blue eyes, cane; no LoRA'
          WHEN sh."referenceProfileId" = 'PAX_HE'    THEN 'PAX_HE identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_06a_couple_man.png — 33yo man, short dark hair and trimmed beard, navy crew neck sweater, set jaw; no LoRA; PAX_SHE if in frame is text-described back-turned only (SingleWithBack)'
          WHEN sh."referenceProfileId" = 'PAX_SHE'   THEN 'PAX_SHE identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_06b_couple_woman.png — 32yo woman, auburn low ponytail, oversized grey turtleneck, red eyes; no LoRA; PAX_HE if in frame is text-described back-turned only (SingleWithBack)'
          WHEN sh."referenceProfileId" = 'PAX_MUS'   THEN 'PAX_MUS identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_07_musician.png — 22yo man, messy dark curly hair, denim jacket over white tee, acoustic guitar, gentle absent smile; no LoRA'
          WHEN sh."referenceProfileId" = 'PAX_GIRL'  THEN 'PAX_GIRL identity via IP-Adapter FaceID v2 from last_shift/reference/passengers/passenger_08_child_girl.png — 7yo girl, brown shoulder length hair, light blue cardigan, solemn dark eyes, holding plush owl with one button eye missing; no LoRA; natural child proportions enforced'
          ELSE 'N/A — environment / object / B-roll shot, no character identity to lock, single-pass Flux env workflow, focus on composition and atmosphere'
        END
      )
    ),
    '{captionGenerator}', to_jsonb(
      'Caption-expansion focus for this shot: emphasize '
      || CASE sh."shotType"
          WHEN 'EWS'  THEN 'wide cinematic establishing composition, depth and scale, the figure or train tiny in vast landscape'
          WHEN 'WS'   THEN 'wide framing with full body or full architecture in view, balanced composition, scene-setting'
          WHEN 'MS'   THEN 'medium framing waist-up, posture and gesture, environmental relationship'
          WHEN 'MCU'  THEN 'medium close-up chest-up, expression and micro-gesture, soft environmental bokeh'
          WHEN 'CU'   THEN 'close-up face only, micro-expression, eye detail and skin texture, environmental softness'
          WHEN 'ECU'  THEN 'extreme close-up macro detail, tactile texture, shallow DOF, isolated object or feature'
          WHEN 'OTS'  THEN 'over-the-shoulder framing, foreground silhouette soft, subject visible past shoulder'
          WHEN 'BACK' THEN 'back view, no face shown, silhouette and posture only, identity by clothing and stance'
          WHEN 'POV'  THEN 'POV through window or doorway, environment-as-subject, motion blur where appropriate'
          ELSE             'cinematic naturalistic framing'
        END
      || '; lighting mood '
      || COALESCE(sh."paletteKey", 'natural') ||
      '; expand Russian/English caption with sensory specifics (sound, smell, temperature implied) before final render'
    )
  ),
  '{continuity}', jsonb_build_object(
    'withPrevious', 'Match palette ' || COALESCE(sh."paletteKey", '?') || ' and timeOfDay ' || COALESCE(sh."timeOfDay", '?') || '; preserve heroine wardrobe state (jacket+cap until A8_SH13, then white shirt only); preserve passenger props (military photograph, mother infant, bride dress bag, businessman laptop+book, veteran pie+medals, couple book, musician guitar, child owl) consistent with their last appearance',
    'withNext',     CASE
      WHEN sh."isIconic" THEN 'Iconic frame — hold composition long enough for thumbnail capture; next shot picks up directly after this beat'
      WHEN sh."isBroll"  THEN 'B-roll cut — next shot may resume any preceding vignette; preserve palette continuity through the transition'
      ELSE                  'Continue vignette of ' || COALESCE(sh."vignetteSlug", 'environment') || '; next shot may stay on same character or cut to conductor reaction'
    END
  )
)
WHERE sh."projectId" = (SELECT id FROM projects WHERE slug = 'last_shift');

COMMIT;
