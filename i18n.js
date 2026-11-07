'use strict';
/* own journal — мови інтерфейсу: English (основна) і Русский.
   Інтерфейс написано англійською; для російської тексти перекладаються на льоту.
   Записи користувачки (усе з translate="no", редактор) ніколи не перекладаються. */

const LANGS = [['en', 'English'], ['ru', 'Русский']];
let LANG = 'en';
try { LANG = localStorage.getItem('oj-lang') || 'en'; } catch (_) {}

const RU = {
  // навігація й загальне
  'Home': 'Главная', 'Entries': 'Записи', 'Planner': 'Планировщик', 'Calendar & stats': 'Календарь и статистика', 'Done': 'Готово', 'Close': 'Закрыть',
  'Back': 'Назад', 'Menu': 'Меню', 'Search': 'Поиск', 'Settings': 'Настройки', 'Save': 'Сохранить', 'Cancel': 'Отмена', 'Delete': 'Удалить', 'Remove': 'Убрать',
  'Edit': 'Редактировать', 'View': 'Посмотреть', 'Open': 'Открыть', 'Reset': 'Сбросить', 'Rename': 'Переименовать', 'Undo': 'Вернуть', 'Redo': 'Повторить',
  'Clear': 'Очистить', 'Saved': 'Сохранено', 'Saved ✓': 'Сохранено ✓', 'Deleted': 'Удалено', 'Added ✓': 'Добавлено ✓', 'Done ✓': 'Выполнено ✓', 'More': 'Ещё',
  'Good morning': 'Доброе утро', 'Good afternoon': 'Добрый день', 'Good evening': 'Добрый вечер', 'Quiet night': 'Тихой ночи', 'Today': 'Сегодня', 'today': 'сегодня',
  'Add the journal to your Home Screen': 'Установи дневник на экран «Домой»',
  'In Safari tap “Share” ⬆︎ → “Add to Home Screen” and open the journal from the icon.': 'В Safari нажми «Поделиться» ⬆︎ → «На экран „Домой“» и открывай дневник с иконки.',
  'Entries made here in the browser and in the Home Screen app are stored separately.': 'Записи в браузере и в приложении с иконки хранятся отдельно.',
  'It’s been a while since your last backup. Save one so your entries never get lost.': 'Давно не было резервной копии. Сохрани её, чтобы записи точно не потерялись.',
  'entries': 'записей', 'Streak:': 'Серия:', 'This week': 'Эта неделя', 'Mood calendar': 'Календарь настроения', 'Photo of the month': 'Фото месяца', 'photo of the month': 'фото месяца',
  'On this day': 'В этот день', 'Recent memories': 'Последние воспоминания', 'All': 'Все', 'Your story starts here': 'Здесь начнётся история твоей жизни',
  'Tap “+” to write your first entry — add thoughts, photos and emotions.': 'Нажми «+», чтобы сделать первую запись — добавь мысли, фото и эмоции.',
  'Calendar': 'Календарь', 'New entry': 'Новая запись', 'Archive by year': 'Архив по годам', 'Favorite memories': 'Избранные воспоминания', 'Photos': 'Фотографии',
  'Month summary': 'Итоги месяца', 'Mood stats': 'Статистика настроения', 'Themes': 'Темы', 'Upcoming': 'Ближайшие дела', 'next two weeks': 'на две недели вперёд',
  'Nothing planned yet.': 'Пока ничего не запланировано.',
  // настрій дня
  'Mood of the day': 'Настроение дня', 'Mood': 'Настроение', 'so far': 'пока что', 'How are you feeling?': 'Как ты себя чувствуешь?', 'No mood marks': 'Без отметок настроения',
  'Change': 'Изменить', 'Mark': 'Отметить', 'A tie between emotions — the result follows the day’s average mood.': 'Поровну разных эмоций — итог по среднему настроению дня.',
  'Tap the smileys that match your mood during the day. The journal counts which one you picked most and shows the picture of your day.': 'В течение дня нажимай смайлики, которые подходят твоему настроению. Дневник посчитает, какого было больше всего, и покажет картинку твоего дня.',
  'No mood was marked on this day.': 'В этот день настроение не отмечали.', 'marked': 'отмечено', '— marked ✓': '— отмечено ✓',
  'Tap an emotion every time you feel it — you can mark the same one several times. The one you mark most sets the picture of the day.': 'Нажимай эмоцию каждый раз, когда её чувствуешь — одну и ту же можно отметить несколько раз. Та, которой будет больше всего, определит картинку дня.',
  'Marks (tap to remove)': 'Отметки (нажми, чтобы убрать)', 'Clear all marks for the day': 'Убрать все отметки дня',
  'a calm, quiet day': 'ровный, тихий день', 'a day full of warm light': 'день, полный тёплого света', 'a day that shines': 'день, который сияет', 'a heart full of love': 'сердце полно любви',
  'calm and warmth': 'покой и тепло', 'time to rest': 'время отдохнуть', 'be gentle with yourself today': 'береги себя сегодня', 'you’re not alone, this will pass': 'ты не одна, всё пройдёт',
  'breathe out, you’re allowed to feel this': 'выдохни, ты имеешь право это чувствовать', 'step by step': 'шаг за шагом', 'too much at once — take a pause': 'слишком много всего — пауза',
  // емоції
  'Emotions': 'Эмоции', 'Positive': 'Позитивные', 'Neutral & mixed': 'Нейтральные и смешанные', 'Difficult': 'Сложные',
  'Calm': 'Спокойствие', 'Content': 'Удовлетворение', 'Joy': 'Радость', 'Elation': 'Восторг', 'Tenderness': 'Нежность', 'Admiration': 'Восхищение', 'In love': 'Влюблённость',
  'Relief': 'Облегчение', 'Confidence': 'Уверенность', 'Inspired': 'Вдохновение', 'Excited': 'Предвкушение', 'Touched': 'Умиление', 'Gratitude': 'Благодарность', 'Cozy': 'Уют',
  'Hope': 'Надежда', 'Empty': 'Пустота', 'Tired': 'Усталость', 'Thoughtful': 'Задумчивость', 'Confused': 'Растерянность', 'Tense': 'Напряжение', 'Awkward': 'Неловкость',
  'Indifferent': 'Безразличие', 'Bored': 'Скука', 'Nostalgic': 'Ностальгия', 'Anxious': 'Тревога', 'Sad': 'Грусть', 'Disappointed': 'Разочарование', 'Depressed': 'Подавленность',
  'Angry': 'Злость', 'Irritated': 'Раздражение', 'Grief': 'Сильная печаль', 'Afraid': 'Страх', 'Overwhelmed': 'Перегрузка', 'Despair': 'Отчаяние', 'Lonely': 'Одиночество', 'Guilty': 'Вина',
  'Neutral': 'Спокойно', 'Happy': 'Радостно', 'Ecstatic': 'В восторге', 'Stressed out': 'Перегружено',
  'Pick everything you feel — several is fine. The first one (★) is shown most prominently.': 'Выбери всё, что чувствуешь — можно несколько. Первая выбранная (★) показывается заметнее всех.',
  'Add your own emotion': 'Добавить свою эмоцию', 'Name': 'Название', 'For example, Dreamy': 'Например, Мечтательность', 'Face': 'Лицо', 'Color': 'Цвет', 'Group': 'Группа',
  'Mood level on the chart:': 'Уровень настроения на графике:', 'New emotion': 'Новая эмоция', 'Type a name for the emotion': 'Напиши название эмоции', 'Emotion added': 'Эмоция добавлена',
  'Emotion library': 'Библиотека эмоций', 'New name for this emotion:': 'Новое название этой эмоции:', 'New name for this mood:': 'Новое название этого настроения:',
  'Restore original name': 'Вернуть исходное название', 'Delete emotion': 'Удалить эмоцию',
  'Delete this emotion from the library? It will disappear from old entries.': 'Удалить эту эмоцию из библиотеки? В старых записях она исчезнет.',
  'emotions. Tap any emotion to rename it; your own emotions can also be deleted.': 'эмоций. Нажми на эмоцию, чтобы переименовать её; свои эмоции можно и удалить.',
  // запис
  'Protected entry': 'Защищённая запись', 'Open entry': 'Открыть запись', 'Open with password': 'Открыть паролем', 'Open with Face ID': 'Открыть через Face ID',
  'hidden from the feed': 'скрыта в ленте', '👁 hidden from the feed': '👁 скрыта в ленте', 'password-protected': 'защищена паролем', '🔒 password-protected': '🔒 защищена паролем',
  'Created': 'Создано', 'Added to favorites ★': 'Добавлено в избранное ★', 'Removed from favorites': 'Убрано из избранного', 'Entry': 'Запись',
  'Show in feed': 'Показывать в ленте', 'Hide from feed': 'Скрыть из ленты', 'Remove password': 'Снять пароль', 'Protect with password': 'Защитить паролем', 'Delete entry': 'Удалить запись',
  'Enter your password': 'Введи пароль', 'Set a password first': 'Сначала установи пароль', 'Wrong password': 'Неверный пароль',
  'Entry hidden from the feed, calendar and search': 'Запись скрыта из ленты, календаря и поиска', 'Entry is visible again': 'Запись снова видна',
  'Entry protected with password 🔒': 'Запись защищена паролем 🔒', 'Protection removed': 'Защита снята', 'Password to remove protection': 'Пароль, чтобы снять защиту',
  'Password to protect the entry': 'Пароль для защиты записи', 'Entry password': 'Пароль записи', 'Delete this entry forever? Its photos will be deleted too.': 'Удалить эту запись навсегда? Её фото тоже будут удалены.',
  'Delete this entry forever?': 'Удалить эту запись навсегда?', 'Entry deleted': 'Запись удалена', 'Editing': 'Редактирование', 'Title': 'Заголовок', 'What happened today?…': 'Что сегодня произошло?…',
  'Size': 'Размер', 'Bold': 'Жирный', 'Italic': 'Курсив', 'Underline': 'Подчёркнутый', 'List': 'Список', 'Numbered list': 'Нумерованный список', 'Photo': 'Фото', 'Voice note': 'Голосовая заметка',
  'Drawing': 'Рисунок', 'Quote': 'Цитата', 'Divider': 'Разделитель', 'Hide keyboard': 'Скрыть клавиатуру', 'saved ✓': 'сохранено ✓', 'Adding photo…': 'Добавляю фото…',
  'Couldn’t add one of the photos': 'Не удалось добавить одно из фото', 'Photo added 📷': 'Фото добавлено 📷', 'Text size': 'Размер текста', 'Text size:': 'Размер текста:', 'Small': 'Мелкий',
  'Normal': 'Обычный', 'Larger': 'Крупнее', 'Text color': 'Цвет текста', 'Voice note added 🎙': 'Голосовая заметка добавлена 🎙', 'Drawing added 🎨': 'Рисунок добавлен 🎨',
  'Drawing added ✓': 'Рисунок добавлен ✓', 'Couldn’t save the drawing': 'Не удалось сохранить рисунок', '(theme default)': '(как в теме)', 'Medium': 'Среднее', 'Large': 'Большое',
  'Full width': 'На всю ширину', 'Left': 'Слева', 'Center': 'По центру', 'Right': 'Справа', 'Move up': 'Выше', 'Move down': 'Ниже', 'Make photo of the month': 'Сделать фото месяца',
  'Photo of the month saved ✨': 'Фото месяца сохранено ✨', 'Make photo of the year': 'Сделать фото года', 'Photo of the year saved ✨': 'Фото года сохранено ✨', 'Delete photo': 'Удалить фото',
  'Font': 'Шрифт', 'Text font': 'Шрифт текста', 'Default font': 'Шрифт по умолчанию',
  // календар і статистика
  'No entries on this day.': 'В этот день записей нет.', 'New entry for this day': 'Новая запись на этот день', 'no data': 'нет данных', 'other emotions': 'другие эмоции', 'Summary': 'Итог',
  'Choose a month': 'Выбери месяц', 'marks': 'отметок', 'days with emotions': 'дней с эмоциями', 'photos': 'фото', 'average mood': 'среднее настроение', 'Mood line': 'Линия настроения',
  'each dot is a day': 'каждая точка — день', 'weekly average': 'среднее за неделю', 'monthly average': 'среднее за месяц', 'Week of': 'Неделя с',
  'Tap a dot to open the day. Gaps are days without entries (not a bad mood).': 'Нажми на точку, чтобы открыть день. Разрывы — дни без записей (это не плохое настроение).',
  'A chart will appear here once you pick emotions in your entries.': 'Здесь появится график, когда ты выберешь эмоции в записях.', '◌ Days without data:': '◌ Дней без данных:',
  'color = main emotion of the day': 'цвет — главная эмоция дня', 'Top emotions': 'Какие эмоции преобладали', 'how many times and what percent': 'сколько раз и какой процент',
  'No emotions for this period yet.': 'Пока нет эмоций за этот период.', 'Collapse': 'Свернуть', 'Show all': 'Показать все', 'Mood in percent': 'Настроение в процентах', 'Groups': 'Группы',
  'No data for this period.': 'Нет данных за этот период.', 'Days without entries (': 'Дни без записей (', ') are not counted and aren’t considered bad.': ') не учитываются и не считаются плохими.',
  'Mood by weekday': 'Настроение по дням недели', 'best —': 'лучший —', 'Not enough data.': 'Недостаточно данных.', 'Emotions that come together': 'Эмоции, которые приходят вместе',
  'Pick several emotions in an entry and pairs will show up here.': 'Выбирай несколько эмоций в записи — и здесь появятся пары.', 'Brightest days': 'Самые светлые дни', 'None yet.': 'Пока нет.',
  'Hardest days': 'Самые трудные дни', 'take care of yourself 🤍': 'береги себя 🤍', 'No hard days.': 'Трудных дней не было.', 'Compared with the previous period': 'По сравнению с прошлым периодом',
  'Days with emotions': 'Дней с эмоциями', 'Most frequent emotion of the day': 'Самая частая эмоция дня', 'Great': 'Отлично', 'Good': 'Хорошо', 'Okay': 'Ровно', 'Not easy': 'Непросто', 'Hard': 'Тяжело',
  'days': 'дней', 'Month': 'Месяц', 'months': 'месяцев', 'Year': 'Год', 'All time': 'Всё время', '7 days': '7 дней', '30 days': '30 дней', '3 months': '3 месяца', '6 months': '6 месяцев', '12 months': '12 месяцев',
  // фото, місяць, рік
  'Choose from your photo library': 'Выбрать из галереи телефона', 'Suggestions from your entries': 'Предложения из твоих записей', 'No photos in entries for this period yet.': 'В записях за этот период ещё нет фото.',
  'Remove photo': 'Убрать фото', 'Choose a photo that sums up': 'Выбери фото, которое символизирует', 'photo of the year': 'фото года',
  'The photo of the month is chosen on the month page. If none is chosen, a photo from your entries is shown.': 'Фото месяца выбирается на странице месяца. Если не выбрано — показывается фото из записей.',
  'Photo of': 'Фото', 'No photos this year yet.': 'В этом году ещё нет фото.', 'Months': 'Месяцы', 'All photos': 'Все фото', 'tap to choose the photo of the month': 'нажми, чтобы выбрать фото месяца',
  'Emotions of the month': 'Эмоции месяца', 'overall': 'в целом', 'No emotion marks.': 'Без отметок эмоций.', 'Brightest moments': 'Самые яркие моменты', 'Photos of the month': 'Фотографии месяца',
  'All entries': 'Все записи', 'Most frequent emotions': 'Самые частые эмоции', 'Year stats': 'Статистика года', 'Favorite moments of the year': 'Избранные моменты года', 'Archive': 'Архив',
  'The archive will appear once you have entries.': 'Архив появится, когда будут записи.', 'Star important entries — they’ll gather here.': 'Отмечай важные записи звёздочкой — они соберутся здесь.',
  // пошук
  'Words, a person, an event, “July”, “March 12”…': 'Слова, человек, событие, «июль», «12 марта»…', 'Period': 'Период', '📅 Period': '📅 Период', 'Favorites': 'Избранное', '★ Favorites': '★ Избранное',
  'Type a word, a name, an event, a month or a date. You can also search by emotions and photo captions.': 'Введи слово, имя, событие, название месяца или дату. Можно искать по эмоциям и подписям к фото.',
  'Found:': 'Найдено:', 'Nothing found': 'Ничего не найдено', 'No photos found': 'Фото не найдены', 'Search by emotions': 'Поиск по эмоциям', '☺︎ Emotions': '☺︎ Эмоции',
  'Days when the mood was mostly': 'Дни, когда преобладало настроение', 'Any': 'Любое', 'Mood:': 'Настроение:', '☁︎ Mood of the day': '☁︎ Настроение дня', '☀︎ Mood of the day': '☀︎ Настроение дня',
  // налаштування
  'MB': 'МБ', 'never': 'ещё не было', 'About me': 'Обо мне', 'What should I call you?': 'Как к тебе обращаться?', 'Appearance': 'Оформление', 'Theme library': 'Библиотека тем',
  'My style: colors, background, header': 'Мой стиль: цвета, фон, шапка', 'My pictures: mood of the day & smileys': 'Мои картинки: настроение дня и смайлики', 'Decorative details': 'Декоративные мелочи',
  'Header animation (fireflies, snow…)': 'Анимация шапки (светлячки, снег…)', 'Serif font for entries': 'Текст записей шрифтом с засечками', 'Backup & new phone': 'Резервная копия и новый телефон',
  'Everything is stored only on this phone. A backup is': 'Всё хранится только на этом телефоне. Копия — это', 'one file': 'один файл',
  'with your whole journal: entries with dates, photos, voice notes, drawings, tags, mood, plans, themes, style and your pictures. Save it to “Files” → iCloud Drive. On a new phone: install own journal → “Restore from backup” — and everything will be back.': 'со всем дневником: записи с датами, фото, голосовые, рисунки, теги, настроение, дела, темы, оформление и твои картинки. Сохрани его в «Файлы» → iCloud Drive. На новом телефоне: установи own journal → «Восстановить из копии» — и всё будет как раньше.',
  'Last backup:': 'Последняя копия:', 'Create full backup': 'Создать полную копию', 'Save / share file': 'Сохранить / отправить файл', 'Restore from backup': 'Восстановить из копии',
  'Export to archive (.zip): entries, photos, voice': 'Экспорт в архив (.zip): записи, фото, голос', 'The archive opens on any computer: a page with all entries + folders with photos and voice notes.': 'Архив открывается на любом компьютере: страница со всеми записями + папки с фото и голосовыми.',
  'Privacy': 'Защита', 'The journal opens only with your password.': 'Дневник открывается только с твоим паролем.', 'You can set a 4-digit password — it will be asked when opening.': 'Можно поставить пароль из 4 цифр — он будет спрашиваться при открытии.',
  'Change password': 'Изменить пароль', 'Set password': 'Установить пароль', 'Show hidden entries': 'Показывать скрытые записи',
  'Single entries can be hidden from the feed or password-protected — in the entry menu (⋯). If you forget the password, the entries can’t be opened, so make backups.': 'Отдельные записи можно скрыть из ленты или защитить паролем — в меню записи (⋯). Если забудешь пароль, открыть записи не получится, поэтому делай резервные копии.',
  'Home Screen icon': 'Иконка на экране «Домой»',
  'You can use your own picture as the icon of own journal. iPhone takes the icon at the moment you add it to the Home Screen, so a new icon appears after adding it again.': 'Можно поставить свою картинку как иконку own journal. iPhone берёт иконку в момент добавления на экран «Домой», поэтому новая иконка появится после повторного добавления.',
  'Choose picture': 'Выбрать картинку', 'Restore default icon': 'Вернуть стандартную иконку', 'Little messages': 'Маленькие послания', 'Add your own message…': 'Добавить своё послание…',
  'Add message': 'Добавить послание', 'Reminders': 'Напоминания', 'About the journal': 'О дневнике', 'Space used on phone': 'Занимает на телефоне', 'Protected storage': 'Защищённое хранилище',
  'yes ✓': 'да ✓', 'standard': 'обычное', 'Preparing backup…': 'Готовлю копию…', 'Backup ready': 'Копия готова', 'Now tap “Save / share file”': 'Теперь нажми «Сохранить / отправить файл»',
  'Didn’t work. Try again': 'Не получилось. Попробуй ещё раз', 'Backup saved': 'Копия сохранена', 'Couldn’t share the file': 'Не удалось поделиться файлом', 'Restoring…': 'Восстанавливаю…',
  'No new entries in the backup (all are already here)': 'Новых записей в копии не найдено (все уже есть)', 'Password to show hidden entries': 'Пароль, чтобы показать скрытые',
  'Building archive…': 'Собираю архив…', 'Archive ready': 'Архив готов', 'Icon saved. Add the journal to the Home Screen again to see it': 'Иконка сохранена. Добавь дневник на экран «Домой» снова, чтобы увидеть её',
  'Message added': 'Послание добавлено', 'Remove password?': 'Убрать пароль?', 'Language': 'Язык', 'Language of the app': 'Язык приложения',
  'Never': 'Никогда', 'Rarely (as a surprise)': 'Изредка (как сюрприз)', 'Sometimes': 'Иногда', 'Once a day': 'Раз в день', 'Every time': 'Каждый раз',
  // теми й стиль
  'based on': 'на основе', 'Restore previous look': 'Вернуть прежнее оформление', '↩︎ Restore previous look': '↩︎ Вернуть прежнее оформление',
  'Your own themes will appear here. Set colors, fonts and pictures in “My style” and tap “Save as my theme”.': 'Здесь появятся твои темы. Настрой цвета, шрифты и картинки в «Мой стиль» и нажми «Сохранить как мою тему».',
  'My style: colors, fonts, pictures': 'Мой стиль: цвета, шрифты, картинки', 'Theme changed ✨ (you can undo ↩︎)': 'Тема изменена ✨ (можно вернуть ↩︎)', 'Previous look restored': 'Прежнее оформление возвращено',
  'Theme': 'Тема', 'Delete this theme?': 'Удалить эту тему?', 'My style': 'Мой стиль', 'Save as my theme': 'Сохранить как мою тему', 'Base': 'Основа', 'Theme illustration as full background': 'Иллюстрация темы на весь фон',
  'Fonts': 'Шрифты', 'Headings': 'Заголовки', 'Entry text': 'Текст записей', 'Entry title': 'Заголовок записи', 'This is how regular text will look in your journal.': 'Так будет выглядеть обычный текст в дневнике.',
  'Colors': 'Цвета', 'Accent (lines, marks)': 'Акцент (линии, отметки)', 'Buttons': 'Кнопки', 'Blocks & cards': 'Блоки и карточки', 'Text': 'Текст', 'Background': 'Фон', 'Block style': 'Вид блоков',
  'Card transparency': 'Прозрачность карточек', 'Corner rounding': 'Скругление углов', 'Border around blocks': 'Рамка вокруг блоков', 'Your own pictures': 'Свои картинки',
  'Any photos or illustrations from your library. Each section can have its own.': 'Любые фото или иллюстрации из галереи. Для каждого раздела можно поставить свою.',
  'Home screen picture': 'Картинка главного экрана', 'Journal background (general)': 'Фон дневника (общий)', 'Cover (lock screen)': 'Обложка (экран входа)', 'Name of your theme:': 'Название твоей темы:',
  'My theme': 'Моя тема', 'Seasons': 'Времена года', 'Fairy tale': 'Сказочные', 'My themes': 'Мои темы', 'Autumn': 'Осень', 'Winter': 'Зима', 'Spring': 'Весна', 'Summer': 'Лето',
  'Theme default': 'Как в теме', 'Muted gold': 'Тусклое золото', 'Sage': 'Шалфей', 'Moss': 'Мох', 'Burgundy': 'Бордо', 'Rose': 'Роза', 'Lavender': 'Лаванда', 'Night sky': 'Ночное небо', 'Coffee': 'Кофе', 'Amber': 'Янтарь',
  'Moss, mist and fireflies': 'Мох, туман и светлячки', 'Bookshelves and candles': 'Книжные полки и свечи', 'Flowers, butterflies, magic': 'Цветы, бабочки, магия', 'Cottage, garden and linen': 'Домик, сад и лён',
  'Moon, mist, burgundy': 'Луна, туман, бордо', 'Quiet, text and photos': 'Тишина, текст и фото', 'Falling leaves and warm tea': 'Листопад и тёплый чай', 'Snow, silence, little lights': 'Снег, тишина, огоньки',
  'Blossoms and first leaves': 'Цветение и первые листочки', 'Warm evening and fireflies': 'Тёплый вечер и светлячки', 'Spring in bloom': 'Весна в цвету', 'Sakura, butterflies, morning mist': 'Сакура, бабочки, утренний туман',
  'Summer meadow': 'Летняя поляна', 'Sun, meadows, berries': 'Солнце, луга, ягоды', 'Autumn path': 'Осенняя тропинка', 'Leaves, pumpkins, a cottage': 'Листья, тыквы, домик', 'Christmas winter': 'Рождественская зима',
  'Snow, garlands, lights in cottages': 'Снег, гирлянды, огоньки в домиках', 'Frosty morning': 'Морозное утро', 'Snowy forest and frost patterns': 'Заснеженный лес и морозные узоры',
  'Mushroom houses and magic plants': 'Грибные домики и волшебные растения', 'Forest mood': 'Лесная атмосфера', 'Moss, fireflies, forest creatures': 'Мох, светлячки, лесные существа',
  'Pumpkins, ghosts, a black cat': 'Тыквы, привидения, чёрный кот', 'Vintage circus': 'Винтажный цирк', 'Tent, carousels, curtains': 'Шатёр, карусели, кулисы', 'Jellyfish': 'Медузы',
  'Underwater world and glowing jellyfish': 'Подводный мир и светящиеся медузы', 'Fairies': 'Феи', 'Magic light and a flower meadow': 'Волшебный свет и цветочная поляна', 'Unicorns': 'Единороги',
  'Clouds, rainbow, pastel stars': 'Облака, радуга, пастельные звёзды', 'Space': 'Космос', 'Constellations, planets, the moon': 'Созвездия, планеты, луна',
  'Dark Forest': 'Тёмный лес', 'Cozy Library': 'Уютная библиотека', 'Gothic Nature': 'Готическая природа', 'Minimalist': 'Минимализм', 'Mushroom Oasis': 'Грибной оазис', 'Halloween': 'Хэллоуин', 'Cozy': 'Уют',
  'My photos as backgrounds': 'Мои фото как фоны', 'Add photos from your library and use them as the home picture, background or lock screen.': 'Добавляй фото из галереи и ставь их на главный экран, фон или экран входа.',
  'Add photos': 'Добавить фото', 'Use the theme’s own pictures again': 'Вернуть картинки темы', 'My photo': 'Моё фото', 'Use as home screen picture': 'Поставить на главный экран',
  'Use as background everywhere': 'Поставить фоном везде', 'Use as lock screen cover': 'Поставить на экран входа', 'Delete this photo': 'Удалить это фото',
  'Delete this photo from your backgrounds?': 'Удалить это фото из фонов?', 'Rename this mood': 'Переименовать это настроение', 'Rename emotions': 'Переименовать эмоции',
  'New name for this mood (leave empty to restore):': 'Новое название настроения (оставь пустым, чтобы вернуть):', 'Use as background:': 'Фоном для:',
  'Import from PDF': 'Импорт из PDF', 'Import old diary from PDF': 'Импорт старого дневника из PDF', 'Choose PDF file': 'Выбрать PDF-файл',
  'Import your old diary from a PDF (for example, the “My Diary” export): all days with their dates, times, texts and photos become entries here. Entries that are already imported are skipped.': 'Импортируй старый дневник из PDF (например, экспорт «My Diary»): все дни с датами, временем, текстами и фото станут записями здесь. Уже импортированные записи пропускаются.',
  'Big files are fine — the PDF is read piece by piece. Keep the screen on and the journal open while it works. You can import in parts: choose the pages to import.': 'Большие файлы — не проблема: PDF читается по частям. Не выключай экран и не закрывай дневник, пока идёт импорт. Можно импортировать частями: выбери страницы.',
  'From page': 'С страницы', 'To page': 'По страницу', 'Start import': 'Начать импорт', 'Reading the PDF…': 'Читаю PDF…', 'Keep the screen on and the journal open.': 'Не выключай экран и не закрывай дневник.',
  'Stop here (the read part will be imported)': 'Остановить (прочитанная часть импортируется)', 'Teach me a few letters': 'Научи меня нескольким буквам',
  'These letters appear in your PDF, but I haven’t seen them before. Type what each one is (one letter or sign). I’ll remember them for next time. Leave empty if you’re not sure.': 'Эти буквы есть в твоём PDF, но я их раньше не видел. Напиши, что это за буква или знак. Я запомню на будущее. Если не уверена — оставь пустым.',
  'Continue': 'Продолжить', 'Moods from your old diary': 'Настроения из старого дневника', 'Which emotion does each icon mean? It will be added to those entries.': 'Какую эмоцию означает каждая иконка? Она добавится к этим записям.',
  'Big diary: it’s safest to import about 100 pages at a time. Entries are saved as they are read, so nothing is lost if the page closes. When a part is done (or if it stopped), choose the same file again — it continues by itself.': 'Большой дневник: надёжнее импортировать примерно по 100 страниц. Записи сохраняются сразу при чтении, поэтому ничего не потеряется, даже если страница закроется. Когда часть готова (или если импорт прервался), выбери тот же файл снова — он сам продолжится.',
  'Something went wrong while saving': 'Что-то пошло не так при сохранении', 'Try again': 'Попробовать ещё раз',
  'The PDF is already read — tap “Try again” to save the entries without reading it again. Please send a screenshot of this screen to Claude.': 'PDF уже прочитан — нажми «Попробовать ещё раз», чтобы сохранить записи без повторного чтения. Пришли скриншот этого экрана Claude.',
  'No mood marks this month yet.': 'В этом месяце пока нет отметок настроения.',
  '— no emotion —': '— без эмоции —', 'Finish import': 'Завершить импорт', 'Open my journal': 'Открыть дневник', 'Opening…': 'Открываю…', 'Saving entries…': 'Сохраняю записи…',
  // пароль
  'Repeat password': 'Повтори пароль', 'Doesn’t match. Choose a password again': 'Не совпадает. Придумай пароль ещё раз', 'Password set 🔒': 'Пароль установлен 🔒',
  'Choose a 4-digit password': 'Придумай пароль из 4 цифр', 'Open with': 'Открыть через', 'your memories live here': 'здесь живут твои воспоминания', 'Didn’t work. Enter your password': 'Не получилось. Введи пароль',
  'Couldn’t open the journal storage. Check that Safari is not in Private Browsing mode, and restart.': 'Не удалось открыть хранилище дневника. Проверь, что Safari не в режиме «Частный доступ», и перезапусти.',
  // планувальник
  'Task': 'Задача', 'Plan': 'Дело', 'Meeting': 'Встреча', 'Event': 'Событие', 'Don’t repeat': 'Не повторять', 'Daily': 'Каждый день', 'Weekly': 'Каждую неделю', 'Monthly': 'Каждый месяц', 'Yearly': 'Каждый год',
  'art': 'творчество', 'study': 'учёба', 'work': 'работа', 'personal': 'личное', 'health': 'здоровье', 'travel': 'путешествия', 'people': 'встречи',
  'Paper': 'Бумажный', 'Minimal': 'Минимал', '← to today': '← к сегодня', 'No plans yet': 'Дел пока нет', 'Write about this day': 'Написать об этом дне',
  'Nothing planned — just enjoy life 🌿': 'Ничего не запланировано — можно просто жить 🌿', 'Reminders show here and on the home screen. A web app can’t send notifications.': 'Напоминания видно здесь и на главной. Веб-приложение не может присылать уведомления.',
  'Calendar style': 'Стиль календаря', 'Calendar color (for the “Paper” style)': 'Цвет календаря (для стиля «Бумажный»)', 'What needs to be done?': 'Что нужно сделать?', 'Date': 'Дата', 'Time': 'Время', 'Until': 'До',
  'Category': 'Категория', '＋ category': '＋ категория', 'Repeat': 'Повторять', 'Repeat until (optional)': 'Повторять до (необязательно)', 'Notes…': 'Заметки…', 'Pictures & drawings': 'Картинки и рисунки',
  'Add photo': 'Добавить фото', 'Draw': 'Нарисовать', 'New plan': 'Новое дело', 'Category name:': 'Название категории:', 'Type a name for the plan': 'Напиши название дела',
  'Delete all repeats? (Cancel = remove only this day)': 'Удалить все повторения? (Отмена — убрать только этот день)', 'Delete this plan?': 'Удалить это дело?',
  'Pictures & drawings on this day': 'Картинки и рисунки в этот день', 'Add picture': 'Добавить картинку', 'Remove this picture from the calendar?': 'Убрать эту картинку из календаря?',
  // голос і малювання
  'Recording not found': 'Запись не найдена', 'Couldn’t play the recording': 'Не удалось воспроизвести запись', 'Tap to start recording': 'Нажми, чтобы начать запись', 'Recording…': 'Идёт запись…',
  'Paused': 'Пауза', 'Recording ready — listen and save': 'Запись готова — послушай и сохрани', 'Recording name': 'Название записи', 'Record': 'Записать', 'Stop': 'Стоп', 'Resume': 'Продолжить',
  'Save to entry': 'Сохранить в запись', 'No microphone access. Allow it in Settings → Safari → Microphone.': 'Нет доступа к микрофону. Разреши его в Настройках → Safari → Микрофон.',
  'New recording name:': 'Новое название записи:', 'Delete this voice note?': 'Удалить эту голосовую заметку?', 'Pencil': 'Карандаш', '✎ Pencil': '✎ Карандаш', 'Brush': 'Кисть', '🖌 Brush': '🖌 Кисть',
  'Eraser': 'Ластик', '⌫ Eraser': '⌫ Ластик', 'Clear the canvas?': 'Очистить холст?', 'Leave without saving the drawing?': 'Выйти без сохранения рисунка?',
  // картинки
  'My pictures': 'Мои картинки', 'Here you can use your own pictures instead of the drawn ones: for the mood of the day and for each smiley. Pictures are stored only on this phone and are included in the full backup.': 'Здесь можно поставить свои картинки вместо нарисованных: для настроения дня и для каждого смайлика. Картинки хранятся только на этом телефоне и входят в полную копию.',
  'Import picture pack': 'Импортировать набор картинок', 'Set': 'Набор', 'Set 1': 'Набор 1', 'Set 2': 'Набор 2', 'Drawn': 'Нарисованные', 'Emotion smileys': 'Смайлики эмоций', 'From pack': 'Из набора',
  'From photos': 'Из галереи', 'The library is empty — import a pack or add your own picture from photos.': 'Библиотека пуста — импортируй набор или добавь свою картинку из галереи.',
  'Importing pictures…': 'Импортирую картинки…', 'Couldn’t import the pack': 'Не удалось импортировать набор', 'My picture': 'Моя картинка', 'Wrong file — choose own-journal-pictures': 'Не тот файл — выбери own-journal-картинки',
  // послання: типи
  'Thought': 'Мысль', 'Support': 'Поддержка', 'Wish': 'Пожелание', 'Question for you': 'Вопрос к себе', 'Self-care': 'Забота о себе', 'Just because': 'Просто так',
  // послання
  'Small steps can take you far.': 'Маленькие шаги тоже ведут далеко.', 'Silence is an answer too. Sometimes the best one.': 'Тишина — тоже ответ. Иногда лучший.',
  'You don’t have to bloom all year. Even trees rest in winter.': 'Не нужно цвести круглый год. Даже деревья отдыхают зимой.', 'Everything you feel has a right to exist.': 'Всё, что ты чувствуешь, имеет право быть.',
  'Slow is a speed too.': 'Медленно — это тоже скорость.', 'The best stories are written in pencil: you can always fix them.': 'Лучшие истории пишутся карандашом: их можно исправить.',
  'The forest never hurries, yet everything gets done.': 'Лес не спешит, но всё успевает.', 'The days that feel ordinary often become the dearest memories.': 'Дни, которые кажутся обычными, потом становятся самыми дорогими воспоминаниями.',
  'Light always finds a crack.': 'Свет всегда находит щёлочку.', 'You are not just your mistakes. You are also your attempts.': 'Ты — не только свои ошибки. Ты ещё и свои попытки.',
  'Even the moon has phases, and no one says it’s worse for it.': 'Даже у луны есть фазы — и никто не говорит, что она от этого хуже.', 'Not everything needs to make sense right away. Some things bloom later.': 'Не всё нужно понимать сразу. Некоторые вещи расцветают позже.',
  'Coziness is when you can simply be.': 'Уют — это когда можно просто быть.', 'Your “enough” is already a lot.': 'Твоё «достаточно» — это уже много.', 'What you write down stops spinning in your head.': 'Записанное перестаёт крутиться в голове.',
  'Every page is a little room where you can hide.': 'Каждая страница — маленькая комнатка, где можно спрятаться.', 'The storm passes. The moss stays.': 'Буря проходит. Мох остаётся.',
  'Good things happen without warning too.': 'Хорошее тоже случается без предупреждения.', 'The heart knows the way, even when the head gets lost.': 'Сердце знает дорогу, даже когда голова путается.',
  'Dreams grow like mushrooms after rain — quietly and unexpectedly.': 'Мечты растут, как грибы после дождя, — тихо и неожиданно.',
  'You’re doing more than you think.': 'Ты делаешь больше, чем тебе кажется.', 'You don’t have to be perfect today. Being yourself is enough.': 'Сегодня не нужно быть идеальной. Достаточно быть собой.',
  'You’ve made it through so many hard days — this one will pass too.': 'Ты пережила столько трудных дней — и этот пройдёт.', 'Your drawings, words and thoughts deserve to exist.': 'Твои рисунки, слова и мысли стоят того, чтобы существовать.',
  'Remember when you dreamed of what you have now?': 'Помнишь, как когда-то мечтала о том, что уже есть?', 'Progress isn’t always visible, but it’s there.': 'Прогресс не всегда видно, но он есть.',
  'You’re allowed to start over as many times as you need.': 'Ты можешь начинать сначала столько раз, сколько нужно.', 'A mistake is just a rough draft of a future skill.': 'Ошибка — это просто черновик будущего умения.',
  'You’re braver than you think.': 'Ты смелее, чем думаешь.', 'Don’t compare your chapter one to someone else’s chapter twenty.': 'Не сравнивай свою первую главу с чужой двадцатой.',
  'The fact that you keep trying is already a win.': 'То, что ты продолжаешь пробовать, — уже победа.', 'Your sensitivity isn’t a weakness — it’s a superpower.': 'Твоя чувствительность — не слабость, а суперсила.',
  'You’re not behind. You’re walking your own path.': 'Ты не отстаёшь. Ты идёшь своей тропинкой.', 'Even if today is hard, you’re not alone.': 'Даже если сегодня тяжело — ты не одна.',
  'Every line you draw brings you closer to your dream.': 'Каждая нарисованная линия приближает тебя к мечте.', 'You know how to create beauty. That’s a lot.': 'Ты умеешь создавать красоту. Это уже много.',
  'Your steps may be small, but they’re yours.': 'Твои шаги маленькие, но они твои.', 'You deserve the same kindness you give to others.': 'Ты заслуживаешь той же доброты, которую даришь другим.',
  'Let yourself be proud of something small today.': 'Позволь себе сегодня гордиться чем-то маленьким.', 'You don’t have to carry everything alone. It’s okay to ask for help.': 'Не нужно тянуть всё одной. Можно попросить о помощи.',
  'May something small and lovely happen to you today.': 'Пусть сегодня с тобой случится что-то маленькое и хорошее.', 'Wishing you warm tea, a soft blanket and a calm evening.': 'Желаю тебе тёплого чая, мягкого пледа и спокойного вечера.',
  'May the day be gentle with you.': 'Пусть день будет ласков к тебе.', 'May someone smile at you sincerely today.': 'Пусть сегодня кто-то искренне тебе улыбнётся.',
  'May inspiration find you exactly when you need it.': 'Пусть вдохновение найдёт тебя именно тогда, когда нужно.', 'May there always be a lamp glowing in your window.': 'Пусть в твоём окне всегда горит лампа.',
  'May your way home be beautiful today.': 'Пусть дорога домой сегодня будет красивой.', 'Wishing you a day without rushing.': 'Желаю тебе дня без спешки.', 'May your dreams be soft as moss.': 'Пусть сны будут мягкими, как мох.',
  'May everything sprouting now bloom for sure.': 'Пусть всё, что сейчас прорастает, обязательно расцветёт.', 'Wishing you at least one moment when everything feels right.': 'Желаю тебе хотя бы одного момента, когда всё кажется правильным.',
  'May today have a little bit of fairy tale.': 'Пусть сегодня будет немного сказки.', 'May fireflies light your way.': 'Пусть светлячки освещают тебе путь.', 'Wishing you people you can be quiet with.': 'Желаю тебе людей, с которыми легко молчать.',
  'May this week bring a lovely surprise.': 'Пусть эта неделя принесёт приятный сюрприз.',
  'What made you smile today?': 'Что сегодня заставило тебя улыбнуться?', 'What can you thank yourself for this week?': 'За что ты можешь поблагодарить себя на этой неделе?',
  'What little thing would make this evening cozier?': 'Какая мелочь сделала бы этот вечер уютнее?', 'What would you tell your five-year-old self?': 'Что бы ты сказала себе пятилетней?',
  'What do you really want right now?': 'Чего тебе сейчас на самом деле хочется?', 'Which song describes your mood today?': 'Какая песня описывает твоё сегодняшнее настроение?',
  'What would you draw if no one was watching?': 'Что бы ты нарисовала, если бы никто не смотрел?', 'Who made your day better today?': 'Кто сегодня сделал твой день лучше?',
  'What can you do now that you couldn’t a year ago?': 'Что ты умеешь сейчас, чего не умела год назад?', 'Which place makes you feel at home?': 'Какое место даёт тебе чувство дома?',
  'What surprised you today?': 'Что тебя сегодня удивило?', 'What could you let go of to feel lighter?': 'От чего можно отказаться, чтобы стало легче?', 'Which smell reminds you of childhood?': 'Какой запах напоминает тебе детство?',
  'Which dream have you been putting off for too long?': 'Какую мечту ты давно откладываешь?', 'What would you do with a whole free day?': 'Что бы ты сделала, если бы был целый свободный день?',
  'What would your perfect morning look like?': 'Как выглядело бы твоё идеальное утро?', 'What do the people who love you like about you?': 'Что в тебе нравится людям, которые тебя любят?',
  'Which emotion did you carry the longest today?': 'Какую эмоцию ты сегодня дольше всего носила в себе?', 'What are you proud of but rarely talk about?': 'Чем ты гордишься, но редко об этом говоришь?',
  'Which fairy-tale creature would you be friends with?': 'С каким сказочным существом ты бы дружила?', 'If today were a color, which one would it be?': 'Если бы этот день был цветом — то каким?',
  'What do you want to remember about this month?': 'Что ты хочешь запомнить из этого месяца?',
  'Drink a glass of water. Your body will thank you.': 'Выпей стакан воды. Твоё тело скажет спасибо.', 'Have you eaten properly today?': 'Ты сегодня нормально поела?',
  'Roll your shoulders back and take three deep breaths.': 'Расправь плечи и сделай три глубоких вдоха.', 'You can put your phone down and just look out the window.': 'Можно отложить телефон и просто посмотреть в окно.',
  'Rest is a task too. An important one.': 'Отдых — это тоже дело. Важное.', 'Go to bed a little earlier tonight. You deserve sleep.': 'Ложись сегодня чуть раньше. Ты заслуживаешь сна.',
  'Step outside for a few minutes of fresh air.': 'Выйди на несколько минут на свежий воздух.', 'Saying “no” is self-care too.': 'Сказать «нет» — тоже забота о себе.',
  'Hug yourself. Seriously, right now.': 'Обними себя. Серьёзно, прямо сейчас.', 'Make yourself something tasty for no reason at all.': 'Приготовь себе что-нибудь вкусное без всякого повода.',
  'Stretch like a cat after a nap.': 'Потянись, как кот после сна.', 'If you’re tired, it’s not laziness — it’s a signal.': 'Если устала — это не лень, это сигнал.',
  'Put on your favorite music for five minutes.': 'Включи любимую музыку на пять минут.', 'Take care of your hands: they do so much for you.': 'Позаботься о руках: они столько для тебя делают.',
  'Start the day with something nice, not the news.': 'Начни день с чего-то приятного, а не с новостей.', 'Today you can be softer with yourself.': 'Сегодня можно быть мягче к себе.',
  'Hi! So glad to see you here 🌿': 'Привет! Рад тебя здесь видеть 🌿', 'Somewhere in the forest a tiny mushroom is glowing right now. Just so you know.': 'Где-то в лесу сейчас светится маленький грибочек. Просто знай.',
  'Your journal missed you.': 'Твой дневник скучал по тебе.', 'Today is a great day to write down something lovely.': 'Сегодня отличный день, чтобы записать что-то хорошее.',
  'You’re the main character of this story.': 'Ты — главная героиня этой истории.', 'The cats of the world say hi.': 'Котики мира передают тебе привет.',
  'It’s always warm in this journal. Come by more often.': 'В этом дневнике всегда тепло. Заходи чаще.', 'You smell like tea and adventures. Probably.': 'Ты пахнешь чаем и приключениями. Наверное.',
  'The fireflies gathered to hear your story.': 'Светлячки собрались послушать твою историю.', 'It’s safe here. You can write anything.': 'Здесь безопасно. Можно писать всё.',
  'This day is already a little better because you’re here.': 'Этот день уже стал чуть лучше, потому что ты здесь.', 'Little reminder: you’re awesome.': 'Маленькое напоминание: ты классная.',
  'Someone in the world is thinking of you warmly right now.': 'Кто-то в мире сейчас думает о тебе с теплом.', 'Your journal is waiting for new stories.': 'Твой дневник ждёт новых историй.',
};

/* шаблони з числами */
const RU_PATTERNS = [
  [/^(\d+) of (\d+) done$/, '$1 из $2 выполнено'],
  [/^(\d+) years ago$/, '$1 г. назад'],
  [/^(\d+) days · (\d+) photos$/, '$1 дн. · $2 фото'],
  [/^Emotion library \((\d+)\)$/, 'Библиотека эмоций ($1)'],
  [/^In the library: (\d+) mood pictures, (\d+) smileys\.(.*)$/, 'В библиотеке: $1 картинок настроения, $2 смайликов.$3'],
  [/^Pictures added: (\d+)(.*)$/, 'Добавлено картинок: $1$2'],
  [/^Entries restored: (\d+)(.*)$/, 'Восстановлено записей: $1$2'],
  [/^Delete “(.+)”\?$/, 'Удалить «$1»?'],
  [/^Saving entries… (\d+) \/ (\d+)$/, 'Сохраняю записи… $1 / $2'],
  [/^Show more entries \((\d+)\)$/, 'Показать ещё записи ($1)'],
  [/^Mood of (.+)$/, (_, m) => 'Настроение: ' + m],
  [/^(\d+) of (\d+) days$/, '$1 из $2 дней'],
  [/^Imported (\d+) entries$/, 'Импортировано записей: $1'],
  [/^(\d+) pages$/, 'Страниц: $1'],
  [/^used (\d+)×$/, 'встречается $1×'],
  [/^Page (\d+) of (\d+) · (\d+) entries · (\d+) photos$/, 'Страница $1 из $2 · записей: $3 · фото: $4'],
  [/^Use as background: (.+)$/, (_, n) => 'Фоном для раздела: ' + (RU[n] || n)],
  [/^(.+) — marked ✓$/, '$1 — отмечено ✓'],
  [/^Photo of (\d{4})$/, 'Фото $1 года'],
  [/^Choose a photo that sums up (\d{4})$/, 'Выбери фото, которое символизирует $1 год'],
  [/^Sometimes a quote, a wish or a question for yourself appears when you open the journal\. There are (\d+) messages, and they don’t repeat until almost all have been shown\.$/, 'Иногда при открытии дневника появляется цитата, пожелание или вопрос к себе. В базе $1 посланий, они не повторяются, пока не покажутся почти все.'],
];

/* ---------- дати російською ---------- */
if (LANG === 'ru') {
  const repl = (arr, vals) => arr.splice(0, arr.length, ...vals);
  repl(MONTHS, ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']);
  repl(MONTHS_GEN, ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']);
  repl(MONTHS_SHORT, ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']);
  repl(WEEKDAYS, ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']);
  repl(WD, ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
  D.long = (d) => `${cap(WEEKDAYS[d.getDay()])}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  D.dm = (d) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  D.dmy = (d) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
  document.documentElement.lang = 'ru';
}

/* ---------- переклад тексту на екрані ---------- */
const I18N_SKIP = '[translate="no"],[contenteditable],.rich,textarea,script,style,svg';
const RU_KEYS = Object.keys(RU).sort((a, b) => b.length - a.length);

function trRU(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t || !/[A-Za-z]/.test(t)) return null;
  const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
  if (RU[t] != null) return lead + RU[t] + trail;
  for (const [rx, rep] of RU_PATTERNS) if (rx.test(t)) return lead + t.replace(rx, rep) + trail;
  // фраза з відомим початком або кінцем (наприклад «Found: 3», «Week of 7 ноября»)
  for (const k of RU_KEYS) {
    if (k.length < 4) continue;
    if (t.length > k.length && t.startsWith(k) && /^[\s:·,.(—-]/.test(t.slice(k.length))) return lead + RU[k] + t.slice(k.length) + trail;
    if (t.length > k.length && t.endsWith(k) && /[\s·(—-]$/.test(t.slice(0, t.length - k.length))) return lead + t.slice(0, t.length - k.length) + RU[k] + trail;
  }
  return null;
}

function translateNode(root) {
  if (LANG === 'en' || !root) return;
  if (root.nodeType === 3) {
    const p = root.parentElement;
    if (!p || p.closest(I18N_SKIP)) return;
    const r = trRU(root.nodeValue);
    if (r != null && r !== root.nodeValue) root.nodeValue = r;
    return;
  }
  if (root.nodeType !== 1 || root.closest(I18N_SKIP)) return;
  for (const a of ['placeholder', 'title', 'aria-label', 'data-placeholder']) {
    const v = root.getAttribute && root.getAttribute(a);
    if (v) { const r = trRU(v); if (r != null) root.setAttribute(a, r); }
  }
  if (root.tagName === 'OPTION') { const r = trRU(root.textContent); if (r != null) root.textContent = r; return; }
  for (const ch of Array.from(root.childNodes)) translateNode(ch);
}

if (LANG !== 'en') {
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') translateNode(m.target);
      else for (const n of m.addedNodes) translateNode(n);
    }
  });
  const startObs = () => { translateNode(document.body); obs.observe(document.body, { childList: true, subtree: true, characterData: true }); };
  if (document.body) startObs(); else document.addEventListener('DOMContentLoaded', startObs);
  // діалоги теж
  const wrap = (fn) => (msg, ...rest) => fn.call(window, (msg != null && trRU(String(msg))) || msg, ...rest);
  window.confirm = wrap(window.confirm); window.prompt = wrap(window.prompt); window.alert = wrap(window.alert);
}

async function setLanguage(code) {
  try { localStorage.setItem('oj-lang', code); } catch (_) {}
  S.settings.lang = code;
  await saveSettings();
  location.reload();
}
