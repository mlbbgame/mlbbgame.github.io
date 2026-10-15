
"use strict";

/*
 * MLBB GAME — CLIENT-SIDE DATABASE
 * Предметы и советы встроены в файл.
 * Внешний каталог героев используется только при успешной загрузке.
 * Точные значения характеристик не приводятся без проверки текущего патча.
 */

const $ = id => document.getElementById(id);

const HERO_SOURCE =
  "https://raw.githubusercontent.com/Ceplin03/database-mlbb.Mobile-Legends-Bang-Bang/master/hero.json";
const EQUIPMENT_SOURCE =
  "https://raw.githubusercontent.com/Ceplin03/database-mlbb.Mobile-Legends-Bang-Bang/master/equipment.json";

const HERO_IMAGE_BASE =
  "https://raw.githubusercontent.com/Ceplin03/database-mlbb.Mobile-Legends-Bang-Bang/master/images-hero/";
const ITEM_IMAGE_BASE =
  "https://raw.githubusercontent.com/Ceplin03/database-mlbb.Mobile-Legends-Bang-Bang/master/logo-equipment/";

const roleTranslations = {
  assassin:"Убийца", mage:"Маг", marksman:"Стрелок",
  fighter:"Боец", tank:"Танк", support:"Поддержка"
};

const HERO_IMAGE_OVERRIDES = {
  "chang'e":"chang27e.png",
  "x.borg":"xborg.png",
  "luo yi":"luo_yi.png",
  "yi sun-shin":"yi_sun-shin.png",
  "yu zhong":"yu_zhong.png",
  "popol and kupa":"popol_and_kupa.png",
  "lapu-lapu":"lapu-lapu.png"
};
const heroImageFilename = name => HERO_IMAGE_OVERRIDES[String(name || "").toLowerCase()]
  || (String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "") + ".png");
const heroImageUrl = name => HERO_IMAGE_BASE + encodeURIComponent(heroImageFilename(name));

// Higher-resolution portrait files (256×512 px) for heroes available in the HD set.
// If a portrait is missing or fails to load, the existing avatar URL remains the fallback.
const HERO_HD_IMAGE_FILES = {
  "aamon": "Aamon - Hero1091.png",
  "akai": "Akai - Hero091.png",
  "aldous": "Aldous - Hero641 .png",
  "alice": "Alice - Hero041.png",
  "alpha": "Alpha - Hero281.png",
  "alucard": "Alucard - Hero071.png",
  "angela": "Angela - Hero551.png",
  "argus": "Argus - Hero451.png",
  "atlas": "Atlas - Hero931.png",
  "aulus": "Aulus - Hero1081.png",
  "aurora": "Aurora - Hero361.png",
  "badang": "Badang - Hero771.png",
  "balmond": "Balmond - Hero021.png",
  "bane": "Bane - Hero111.png",
  "barats": "Barats - Hero991.png",
  "baxia": "Baxia - Hero871.png",
  "beatrix": "Beatrix - Hero1051.png",
  "belerick": "Belerick - Hero701.png",
  "benedetta": "Benedetta - Hero971.png",
  "brody": "Brody - Hero1001.png",
  "bruno": "Bruno - Hero121.png",
  "carmilla": "Carmilla - Hero921.png",
  "cecilion": "Cecilion - Hero911.png",
  "change": "Chang'e - Hero611.png",
  "chou": "Chou - Hero261.png",
  "claude": "Claude - Hero651.png",
  "clint": "Clint - Hero131.png",
  "cyclops": "Cyclops - Hero331.png",
  "diggie": "Diggie - Hero481.png",
  "esmeralda": "Esmeralda - Hero811.png",
  "estes": "Estes - Hero341.png",
  "eudora": "Eudora - Hero151.png",
  "fanny": "Fanny - Hero171.png",
  "faramis": "Faramis - Hero761.png",
  "floryn": "Floryn - Hero1121.png",
  "franco": "Franco - Hero101.png",
  "freya": "Freya - Hero221.png",
  "gatotkaca": "Gatotkaca - Hero411.png",
  "gloo": "Gloo - Hero1041.png",
  "gord": "Gord - Hero231.png",
  "granger": "Granger - Hero791.png",
  "grock": "Grock - Hero441.png",
  "guinevere": "Guinevere - Hero801.png",
  "gusion": "Gusion - Hero561.png",
  "hanabi": "Hanabi - Hero601.png",
  "hanzo": "Hanzo - Hero691.png",
  "harith": "Harith - Hero731.png",
  "harley": "Harley - Hero421.png",
  "hayabusa": "Hayabusa - Hero211.png",
  "helcurt": "Helcurt - Hero511.png",
  "hilda": "Hilda - Hero351.png",
  "hylos": "Hylos - Hero491.png",
  "irithel": "Irithel - Hero431.png",
  "jawhead": "Jawhead - Hero541.png",
  "johnson": "Johnson - Hero321.png",
  "kadita": "Kadita - Hero751.png",
  "kagura": "Kagura - Hero251 (Revamped).png",
  "kaja": "Kaja - Hero621.png",
  "karina": "Karina - Hero081.png",
  "karrie": "Karrie - Hero401.png",
  "khaleed": "Khaleed - Hero981.png",
  "khufra": "Khufra - Hero781.png",
  "kimmy": "Kimmy - Hero711.png",
  "lancelot": "Lancelot - Hero471 (Revamped).png",
  "lapulapu": "Lapu-Lapu - Hero371.png",
  "layla": "Layla - Hero181.png",
  "leomord": "Leomord - Hero671.png",
  "lesley": "Lesley - Hero531.png",
  "ling": "Ling - Hero841.png",
  "lolita": "Lolita - Hero201.png",
  "lunox": "Lunox - Hero681.png",
  "luoyi": "Luo yi - Hero961.png",
  "lylia": "Lylia - Hero861.png",
  "martis": "Martis - Hero581.png",
  "masha": "Masha - Hero881.png",
  "mathilda": "Mathilda - Hero1021.png",
  "minotaur": "Minotaur - Hero191.png",
  "minsitthar": "Minsitthar - Hero741.png",
  "miya": "Miya - Hero011.png",
  "moskov": "Moskov - Hero311.png",
  "nana": "Nana - Hero051.png",
  "natalia": "Natalia - Hero241.png",
  "natan": "Natan - Hero1071.png",
  "odette": "Odette - Hero461 (Revamped).png",
  "paquito": "Paquito - Hero1031.png",
  "pharsa": "Pharsa - Hero521.png",
  "phoveus": "Phoveus - Hero1061.png",
  "popolandkupa": "Popol and Kupa - Hero941.png",
  "rafaela": "Rafaela - Hero141.png",
  "roger": "Roger - Hero391.png",
  "ruby": "Ruby - Hero291.png",
  "saber": "Saber - Hero031.png",
  "selena": "Selena - Hero631.png",
  "silvanna": "Silvanna - Hero901.png",
  "sun": "Sun - Hero271.png",
  "terizla": "Terizla - Hero821.png",
  "thamuz": "Thamuz - Hero721.png",
  "tigreal": "Tigreal - Hero061.png",
  "uranus": "Uranus - Hero591.png",
  "vale": "Vale - Hero661.png",
  "valentina": "Valentina - Hero1101.png",
  "valir": "Valir - Hero571.png",
  "vexana": "Vexana - Hero381.png",
  "wanwan": "Wanwan - Hero891.png",
  "xborg": "Xborg - Hero831.png",
  "yisunshin": "Yi Sun-shin - Hero301.png",
  "yuzhong": "Yu Zhong - Hero951.png",
  "yve": "Yve - Hero1011.png",
  "zhask": "Zhask - Hero501.png",
  "zilong": "Zilong - Hero161.png"
};
const heroImageKey = name => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
// High-resolution hero splash artwork, optimized to responsive WebP for faster loading.
// Each source path was checked against the image repository; the portrait set remains the fallback.
const HERO_SPLASH_ART_OVERRIDES = {
  // Retained as a verified artwork path for catalog coverage; target heroes now prefer avatar icons.
  "arlott": "Arlott/Lone Lancer.png",
  // Aamon, Alpha and Alucard use tighter portrait sources in the circular catalog.
  "argus": "Argus/Dark Angel.png",
  "bane": "Bane/Frozen King.png",
  "beatrix": "Beatrix/Dawnbreak Soldier.png",
  "benedetta": "Benedetta/Death Oath.png",
  "bruno": "Bruno/The Protector.png",
  "carmilla": "Carmilla/Shadow of Twilight.png",
  "cecilion": "Cecilion/Embrace of Night.png",
  "chou": "Chou/Kung Fu Boy.png",
  "cici": "Cici/Buoyant Performer.png",
  "chip": "Chip/Nexus Engineer.png",
  "claude": "Claude/Plunderous Pirate.png",
  "cyclops": "Cyclops/Starsoul Magician.png",
  "diggie": "Diggie/Circus Clown.png",
  "dyrroth": "Dyrroth/Prince of the Abyss.png",
  "edith": "Edith/Ancient Guard.png",
  "esmeralda": "Esmeralda/Astrologer.png",
  "estes": "Estes/White Crane.png",
  "fanny": "Fanny/Blade Dancer.png",
  "faramis": "Faramis/Soul Binder.png",
  "floryn": "Floryn/Fluffy Dream.png",
  "franco": "Franco/Apocalypse.png",
  "fredrinn": "Fredrinn/Rogue Appraiser.png",
  "freya": "Freya/Valkyrie.png",
  "gatotkaca": "Gatotkaca/Mighty Legend.png",
  "gloo": "Gloo/Verdant Enchanter.png",
  "gord": "Gord/Professor of the Mystics.png",
  "granger": "Granger/Death Chanter.png",
  "grock": "Grock/Grave Guardian.png",
  "guinevere": "Guinevere/Amethyst Dance.png",
  "gusion": "Gusion/Holy Blade.png",
  "hanabi": "Hanabi/Scarlet Flower.png",
  "hayabusa": "Hayabusa/Shadow of Obscurity.png",
  "helcurt": "Helcurt/Shadowbringer.png",
  "hilda": "Hilda/Power of Wildness.png",
  "harith": "Harith/Lightborn - Inspirer.png",
  "ixia": "Ixia/Shifting Sand.png",
  "hylos": "Hylos/Grand Warden.png",
  "irithel": "Irithel/Jungle Heart.png",
  "julian": "Julian/Silent Edge.png",
  "jawhead": "Jawhead/Steel Sweetheart.png",
  "johnson": "Johnson/Wreck King.png",
  "joy": "Joy/Feline Ranger.png",
  "kadita": "Kadita/Ocean Goddess.png",
  "kalea": "Kalea/Sakura Haruno.png",
  "kagura": "Kagura/Onmyouji Master.png",
  "kaja": "Kaja/Skyblocker.png",
  "karina": "Karina/Shadow Blade.png",
  "karrie": "Karrie/Bladed Mantis.png",
  "khaleed": "Khaleed/Desert Scimitar.png",
  "khufra": "Khufra/Desert Tyrant.png",
  "lapulapu": "Lapu-Lapu/Courageous Blade.png",
  "layla": "Layla/Classic Malefic Gunner.png",
  "leomord": "Leomord/Hell Knight.png",
  "lesley": "Lesley/Deadly Sniper.png",
  "ling": "Ling/Cyan Finch.png",
  "lolita": "Lolita/Steel Elf.png",
  "lunox": "Lunox/Twilight Goddess.png",
  "lukas": "Lukas/Naruto Uzumaki.png",
  "luoyi": "Luo Yi/Yin-yang Geomancer.png",
  "lylia": "Lylia/Little Witch.png",
  "martis": "Martis/Ashura King.png",
  "marcel": "Marcel/Soul Photographer.png",
  "masha": "Masha/Wild-oats Fist.png",
  "mathilda": "Mathilda/Swift Plume.png",
  "melissa": "Melissa/Cursed Needle.png",
  "minsitthar": "Minsitthar/King of War.png",
  "miya": "Miya/Moonlight Archer.png",
  "moskov": "Moskov/Spear of Quiescence.png",
  "nana": "Nana/Sweet Leonin.png",
  "natalia": "Natalia/Bright Claw.png",
  "nolan": "Nolan/The Navigator.png",
  "novaria": "Novaria/Star Rebel.png",
  "odette": "Odette/Swan Princess.png",
  "obsidia": "Obsidia/Magitech Wraith.png",
  "pharsa": "Pharsa/Peony Bloom.png",
  "phoveus": "Phoveus/Chains of Sin.png",
  "rafaela": "Rafaela/Flower Fairy.png",
  "roger": "Roger/Dire Wolf Hunter.png",
  "ruby": "Ruby/Cat Girl.png",
  "saber": "Saber/Force Warrior.png",
  "silvanna": "Silvanna/Imperial Knightess.png",
  "sora": "Sora/Shifting Cloud.png",
  "sun": "Sun/Monkey King.png",
  "suyou": "Suyou/Venerated Vigilance.png",
  "terizla": "Terizla/Abyss Guard.png",
  "thamuz": "Thamuz/Lord Lava.png",
  "tigreal": "Tigreal/Warrior of Dawn.png",
  "uranus": "Uranus/Celestial Bastion.png",
  "vale": "Vale/Cerulean Winds.png",
  "valentina": "Valentina/Archmagister.png",
  "vexana": "Vexana/Shimmer of Hope.png",
  "wanwan": "Wanwan/Agile Tiger.png",
  "xavier": "Xavier/Defier of Light.png",
  "yin": "Yin/Martial Genius.png",
  "yisunshin": "Yi Sun-shin/Fleet Warden.png",
  "yuzhong": "Yu Zhong/Black Dragon.png",
  "yve": "Yve/Astrowarden.png",
  "zetian": "Zetian/Celestial Empress.png",
  "zhuxin": "Zhuxin/Emberwisp Mystic.png",
  "zilong": "Zilong/Eastern Warrior.png",
  "akai": "Akai/Monk.png",
  "aldous": "Aldous/Death.png",
  "alice": "Alice/Queen of Blood.png",
  "angela": "Angela/Heartstring.png",
  "atlas": "Atlas/Ocean Gladiator.png",
  "aulus": "Aulus/Barren Pioneer.png",
  "aurora": "Aurora/Maiden of the Glacier.png",
  "badang": "Badang/Fist of Zen.png",
  "balmond": "Balmond/Savage Hunter.png",
  "barats": "Barats/Dino Rider.png",
  "baxia": "Baxia/Black Tortoise.png",
  "belerick": "Belerick/Guard of Nature.png",
  "brody": "Brody/The Lone Star.png",
  "change": "Chang'e/Lunar Magic.png",
  "clint": "Clint/West Justice.png",
  "eudora": "Eudora/Lightning Weaver.png",
  "hanzo": "Hanzo/The Pale Phantom.png",
  "harley": "Harley/Star Magician.png",
  "hirara": "Hiara/Gilded Embers.png",
  "kimmy": "Kimmy/Charge Leader.png",
  "lancelot": "Lancelot/Swordmaster.png",
  "minotaur": "Minotaur/Son of Minos.png",
  "natan": "Natan/Time Wielder.png",
  "paquito": "Paquito/The Heavenly Fist.png",
  "popolandkupa": "Popol and Kupa/Tribal Howl.png",
  "selena": "Selena/Abyssal Witch.png",
  "valir": "Valir/Son of Flames.png",
  "xborg": "Xborg/Moto Drifter.png",
  "zhask": "Zhask/The King of Swarms.png"
};
const heroSplashImageUrl = path => {
  const source = "raw.githubusercontent.com/Sparkies01/Splash/main/" +
    String(path || "").split("/").map(part => encodeURIComponent(part)).join("/");
  return "https://images.weserv.nl/?url=" + encodeURIComponent(source) +
    "&w=900&h=1200&fit=contain&output=webp&q=90";
};
const heroSplashDirectImageUrl = path =>
  "https://raw.githubusercontent.com/Sparkies01/Splash/main/" +
  String(path || "").split("/").map(part => encodeURIComponent(part)).join("/");
const heroHDImageUrl = name => {
  const key = heroImageKey(name);
  // Prefer higher-resolution splash artwork for other heroes where available.
  // Fall back to the portrait set, then to the base hero icon in heroImageUrl().
  const splashPath = HERO_SPLASH_ART_OVERRIDES[key];
  if (splashPath) return heroSplashImageUrl(splashPath);
  const file = HERO_HD_IMAGE_FILES[key];
  return file ? "https://raw.githubusercontent.com/Lara3924/Lara_Image/main/" + encodeURIComponent(file) : "";
};

// Shared image resolver so hero cards, profiles and the talent planner use the same HD source.
window.GrimGGHeroImageUrl = name => heroHDImageUrl(name) || heroImageUrl(name);

const fallbackHeroes = [
  ["Fanny","Лес","Убийца"],["Vexana","Мид","Маг"],
  ["Claude","Голд","Стрелок"],["Belerick","Роум","Танк"],
  ["Khufra","Роум","Танк"],["Gusion","Лес","Убийца"],
  ["Ling","Лес","Убийца"],["Miya","Голд","Стрелок"],
  ["Layla","Голд","Стрелок"],["Tigreal","Роум","Танк"],
  ["Saber","Лес","Убийца"],["Lancelot","Лес","Убийца"],
  ["Hayabusa","Лес","Убийца"],["Alucard","Лес","Боец"],
  ["Balmond","Лес","Боец"],["Chou","EXP","Боец"],
  ["Terizla","EXP","Боец"],["Yu Zhong","EXP","Боец"],
  ["Dyrroth","EXP","Боец"],["Ruby","EXP","Боец"],
  ["X.Borg","EXP","Боец"],["Paquito","EXP","Боец"],
  ["Alpha","Лес","Боец"],["Fredrinn","Лес","Танк"],
  ["Aamon","Лес","Убийца"],["Julian","Лес","Боец"],
  ["Lunox","Мид","Маг"],["Kagura","Мид","Маг"],
  ["Lylia","Мид","Маг"],["Cecilion","Мид","Маг"],
  ["Luo Yi","Мид","Маг"],["Xavier","Мид","Маг"],
  ["Pharsa","Мид","Маг"],["Aurora","Мид","Маг"],
  ["Odette","Мид","Маг"],["Eudora","Мид","Маг"],
  ["Nana","Мид","Маг"],["Cyclops","Мид","Маг"],
  ["Harith","Мид","Маг"],["Bruno","Голд","Стрелок"],
  ["Brody","Голд","Стрелок"],["Beatrix","Голд","Стрелок"],
  ["Melissa","Голд","Стрелок"],["Ixia","Голд","Стрелок"],
  ["Moskov","Голд","Стрелок"],["Karrie","Голд","Стрелок"],
  ["Wanwan","Голд","Стрелок"],["Hanabi","Голд","Стрелок"],
  ["Lolita","Роум","Танк"],["Atlas","Роум","Танк"],
  ["Minotaur","Роум","Танк"],["Angela","Роум","Поддержка"],
  ["Estes","Роум","Поддержка"],["Floryn","Роум","Поддержка"],
  ["Diggie","Роум","Поддержка"],["Mathilda","Роум","Поддержка"],
  ["Johnson","Роум","Танк"],["Akai","Роум","Танк"],
  ["Franco","Роум","Танк"],["Hylos","Роум","Танк"],
  ["Grock","Роум","Танк"]
].map((h,i)=>({
  id:"local-"+i,
  name:h[0],
  lane:h[1],
  role:h[2],
  roles:[h[2]],
  image:heroHDImageUrl(h[0]) || heroImageUrl(h[0])
}));

const heroTips = {
  Fanny:"Следи за энергией и маршрутами тросов. Выбирай момент, когда опасные навыки контроля соперников уже потрачены.",
  Vexana:"Держись позади передней линии, используй контроль и помогай команде начинать бой.",
  Claude:"Фарми безопасно и выбирай момент для ультимейта, когда противники не могут быстро остановить тебя.",
  Belerick:"Прикрывай союзников и учитывай, кто из соперников наносит основной урон.",
  Khufra:"Сохраняй контроль против мобильных противников и согласовывай начало боя с союзниками.",
  Gusion:"Тренируй комбинации навыков и сохраняй возможность отступить после атаки.",
  Ling:"Следи за ресурсами и позициями врагов, особенно перед командными боями.",
};

const comboGuides = [
  {hero:"Фанни",key:"Fanny",role:"Убийца",difficulty:"Высокая",situation:"Вход в бой и отход",skills:["2","2","3","1","2"],steps:["Начни с троса к стене и сразу задай вторым тросом направление к цели.","Во время пролёта оцени траекторию и запас энергии; не лети прямо в несколько готовых к контролю врагов.","Используй ультимейт по подходящей цели, когда можешь реализовать метку и урон.","Примени первый навык вблизи цели и продолжай движение тросами только при достаточном запасе энергии.","Заранее оставь безопасный маршрут для отхода."],tip:"Это пример входа в бой, а не жёсткая последовательность. У Фанни траектория и запас энергии меняют комбо; отрабатывай тросы в тренировке.",search:"лес тросы мобильность"},
  {hero:"Госсен",key:"Gusion",role:"Убийца",difficulty:"Высокая",situation:"Комбо с обновлением навыков",skills:["2","3","2","1","1","2"],steps:["Метни кинжалы вторым навыком в сторону выбранной цели.","Используй ультимейт, чтобы изменить позицию и обновить навыки.","Повтори второй навык, направляя кинжалы через цель.","Попади первым навыком и используй повторное нажатие для сближения, если метка сработала.","Повтори первый навык, если он уже доступен, чтобы продолжить атаку или сменить позицию.","Верни кинжалы вторым навыком и оцени, безопасно ли продолжать бой."],tip:"Комбо требует точного попадания и своевременного повторного нажатия. Если цель уходит или рядом несколько врагов, сохрани возможность отступить.",search:"лес кинжалы burst"},
  {hero:"Вексана",key:"Vexana",role:"Маг",difficulty:"Средняя",situation:"Контроль перед командным боем",skills:["1","2","3"],steps:["Попробуй остановить опасную цель первым навыком.","Пока враг ограничен в движении, направь второй навык в выбранную область.","Используй ультимейт, когда он поможет закрепить преимущество в бою."],tip:"Держись позади союзников передней линии. Не расходуй все навыки на танка, если рядом есть уязвимая цель.",search:"мид маг контроль teamfight"},
  {hero:"Клод",key:"Claude",role:"Стрелок",difficulty:"Средняя",situation:"Урон по группе",skills:["1","2","3"],steps:["Попади первым навыком по врагам, чтобы усилить подготовку к атаке.","Размести вторую способность так, чтобы сохранить возможность вернуться в безопасную позицию.","Входи с ультимейтом, когда противники потратили опасный контроль или не могут быстро остановить тебя."],tip:"Не начинай ультимейт в центре врагов, если у них готовы оглушение или другие способы прервать атаку.",search:"голд стрелок ультимейт позиция"},
  {hero:"Белерик",key:"Belerick",role:"Танк",difficulty:"Низкая",situation:"Защита союзников",skills:["2","1","3"],steps:["Подойди к союзникам и выбери момент, когда противник угрожает задней линии.","Используй навык сближения или замедления, чтобы помешать врагу.","Примени ультимейт, когда несколько противников находятся в зоне действия и команда готова продолжить."],tip:"Не начинай бой далеко от союзников. Твоя задача — создать для команды удобное окно, а не просто ворваться первым.",search:"роум танк защита контроль"},
  {hero:"Хуфра",key:"Khufra",role:"Танк",difficulty:"Средняя",situation:"Инициация и контроль",skills:["2","1","3"],steps:["Используй второй навык, если нужно мешать мобильным противникам.","Выбери безопасную траекторию для входа с помощью первого навыка.","Сгруппируй противников ультимейтом у стены или в удобной для команды позиции, если ситуация позволяет."],tip:"Согласуй вход с союзниками: контроль без последующего урона редко приносит пользу.",search:"роум танк мобильные герои инициировать"},
  {hero:"Эудора",key:"Eudora",role:"Маг",difficulty:"Низкая",situation:"Поймать одиночную цель",skills:["2","3","1"],steps:["Подойди на безопасную дистанцию и начни с оглушения.","Используй ультимейт, пока цель не может сразу ответить.","Заверши комбо первым навыком и отойди, пока навыки перезаряжаются."],tip:"Выбирай одиночную цель и следи за мини-картой: после комбо у тебя может не остаться способов защититься.",search:"мид маг оглушение burst"},
  {hero:"Лейла",key:"Layla",role:"Стрелок",difficulty:"Низкая",situation:"Безопасный урон с дистанции",skills:["2","1","3"],steps:["Замедли или задень противника вторым навыком, если он подходит на опасную дистанцию.","Используй первый навык для урона и поддержания дистанции.","Применяй ультимейт по подходящей линии атаки, не выходя вперёд команды."],tip:"Для Лейлы позиция важнее сложной комбинации: атакуй с задней линии и заранее продумывай путь отхода.",search:"голд стрелок дальность позиция"}
];

const items = [
{
 id:"bod",name:"Blade of Despair",ru:"Клинок отчаяния",cat:"Attack",
 stats:"Физический урон",
 desc:"Атакующий предмет для усиления физического урона.",
 tip:"Рассматривай, когда герою требуется больше физического урона. Проверяй условия пассивного эффекта в игре."
},
{
 id:"bf",name:"Berserker's Fury",ru:"Ярость берсерка",cat:"Attack",
 stats:"Критические атаки",
 desc:"Предмет для сборок, основанных на критических ударах.",
 tip:"Покупай только тогда, когда критические характеристики подходят выбранному герою."
},
{
 id:"dhs",name:"Demon Hunter Sword",ru:"Меч охотника на демонов",cat:"Attack",
 stats:"Скорость атаки · Урон по здоровью",
 desc:"Помогает некоторым героям наносить урон противникам с большим запасом здоровья.",
 tip:"Сравни с другими вариантами скорости атаки и проверь текущую механику пассивного эффекта."
},
{
 id:"mr",name:"Malefic Roar",ru:"Рёв злобы",cat:"Attack",
 stats:"Физическое пробивание",
 desc:"Атакующий предмет, предназначенный для борьбы с физической защитой противников.",
 tip:"Рассматривай против выносливых целей с физической защитой."
},
{
 id:"hepta",name:"Blade of the Heptaseas",ru:"Клинок гептасисов",cat:"Attack",
 stats:"Физический урон · Внезапная атака",
 desc:"Атакующий предмет, который может подходить героям, рассчитывающим на сильную первую атаку.",
 tip:"Проверь, соответствует ли его пассивный эффект стилю твоего героя."
},
{
 id:"cs",name:"Corrosion Scythe",ru:"Коса коррозии",cat:"Attack",
 stats:"Скорость атаки · Замедление",
 desc:"Предмет для героев, которым важно часто атаковать и затруднять отход противника.",
 tip:"Рассматривай для героев, зависящих от обычных атак."
},
{
 id:"eb",name:"Endless Battle",ru:"Бесконечная битва",cat:"Attack",
 stats:"Смешанные атакующие характеристики",
 desc:"Сочетает несколько характеристик для определённых физических сборок.",
 tip:"Проверь взаимодействие пассивного эффекта с навыками выбранного героя."
},
{
 id:"sc",name:"Sea Halberd",ru:"Морская алебарда",cat:"Attack",
 stats:"Физический урон · Противодействие лечению",
 desc:"Атакующий предмет, который может помочь против восстановления здоровья и щитов.",
 tip:"Рассматривай, если противники сильно зависят от лечения или щитов. Проверь актуальное действие эффекта."
},
{
 id:"hc",name:"Holy Crystal",ru:"Священный кристалл",cat:"Magic",
 stats:"Магическая сила",
 desc:"Предмет для усиления магического урона.",
 tip:"Рассматривай для магов, которым важна магическая мощь."
},
{
 id:"dg",name:"Divine Glaive",ru:"Божественный меч",cat:"Magic",
 stats:"Магическое пробивание",
 desc:"Помогает магическому урону эффективнее проходить через магическую защиту.",
 tip:"Особенно стоит рассмотреть, если соперники собирают магическую защиту."
},
{
 id:"gw",name:"Genius Wand",ru:"Жезл гения",cat:"Magic",
 stats:"Магический урон · Пробивание",
 desc:"Атакующий предмет для определённых магических сборок.",
 tip:"Проверь, насколько часто герой наносит магический урон и как работает пассивный эффект в текущем патче."
},
{
 id:"glow",name:"Glowing Wand",ru:"Светящийся жезл",cat:"Magic",
 stats:"Магический урон · Эффекты",
 desc:"Может помогать героям, которые регулярно наносят магический урон.",
 tip:"Сравни эффект предмета с другими магическими вариантами и механикой выбранного героя."
},
{
 id:"foh",name:"Feather of Heaven",ru:"Перо небес",cat:"Magic",
 stats:"Магическая сила · Скорость атаки",
 desc:"Сочетает магические характеристики и скорость обычных атак.",
 tip:"Рассматривай для героев, у которых обычные атаки взаимодействуют с магическим уроном."
},
{
 id:"bw",name:"Blood Wings",ru:"Кровавые крылья",cat:"Magic",
 stats:"Магическая сила · Выживаемость",
 desc:"Магический предмет, который также может повышать выживаемость.",
 tip:"Подходит не каждой сборке. Сравни с защитными альтернативами."
},
{
 id:"as",name:"Athena's Shield",ru:"Щит Афины",cat:"Defense",
 stats:"Магическая защита",
 desc:"Защитный предмет для противодействия опасному магическому урону.",
 tip:"Рассматривай против магов с сильным взрывным уроном; сверяй текущий пассивный эффект."
},
{
 id:"ra",name:"Radiant Armor",ru:"Сияющая броня",cat:"Defense",
 stats:"Магическая защита",
 desc:"Защитный вариант против определённых типов повторяющегося магического урона.",
 tip:"Выбирай по типу урона противника, а не только по его роли."
},
{
 id:"ac",name:"Antique Cuirass",ru:"Старинная кираса",cat:"Defense",
 stats:"Физическая защита · Здоровье",
 desc:"Защитный предмет против некоторых источников физического урона.",
 tip:"Проверь, подходит ли его эффект против основных угроз вражеской команды."
},
{
 id:"di",name:"Dominance Ice",ru:"Ледяное господство",cat:"Defense",
 stats:"Защита · Противодействие некоторым эффектам",
 desc:"Защитный предмет, который может быть полезен против героев, зависящих от скорости атак или восстановления.",
 tip:"Проверь актуальные параметры пассивного эффекта перед покупкой."
},
{
 id:"imm",name:"Immortality",ru:"Бессмертие",cat:"Defense",
 stats:"Защита · Возможность вернуться в бой",
 desc:"Защитный предмет, который позволяет вернуться в бой после поражения героя, если эффект доступен и не находится на перезарядке.",
 tip:"Может быть полезен для поздних командных боёв. Учитывай время перезарядки эффекта."
},
{
 id:"orc",name:"Oracle",ru:"Оракул",cat:"Defense",
 stats:"Защита · Восстановление",
 desc:"Защитный предмет, который может усиливать подходящие эффекты восстановления и щитов.",
 tip:"Особенно внимательно проверь совместимость с навыками выбранного героя."
},
{
 id:"wb",name:"Warrior Boots",ru:"Ботинки воина",cat:"Movement",
 stats:"Передвижение · Физическая защита",
 desc:"Вариант обуви с уклоном в защиту от физического урона.",
 tip:"Рассматривай против физических угроз, если его свойства подходят ситуации."
},
{
 id:"tb",name:"Tough Boots",ru:"Прочные ботинки",cat:"Movement",
 stats:"Передвижение · Магическая защита",
 desc:"Обувь для защиты от магического урона и некоторых эффектов контроля.",
 tip:"Выбирай, учитывая состав врага и актуальные свойства обуви."
},
{
 id:"ms",name:"Magic Boots",ru:"Магические ботинки",cat:"Movement",
 stats:"Передвижение · Перезарядка",
 desc:"Обувь, которую выбирают, когда важно чаще использовать навыки.",
 tip:"Сравни пользу сокращения перезарядки с защитными вариантами обуви."
},
{
 id:"sb",name:"Swift Boots",ru:"Ботинки стремительности",cat:"Movement",
 stats:"Передвижение · Скорость атаки",
 desc:"Обувь с уклоном в скорость атаки.",
 tip:"Может подойти героям, чья эффективность зависит от обычных атак."
},
{
 id:"arc",name:"Arcane Boots",ru:"Мистические ботинки",cat:"Movement",
 stats:"Передвижение · Магическое пробивание",
 desc:"Обувь для магических сборок с акцентом на пробивание.",
 tip:"Сравни с обувью, дающей защиту или сокращение перезарядки."
},
{
 id:"roam-boots",name:"Roaming Blessing",ru:"Роум-благословение",cat:"Roam",
 stats:"Роум-эффект, связанный с обувью",
 desc:"Справочная карточка: роум-эффект выбирается для поддержки команды и связан с ботинками. Это не отдельная пара обуви для покупки.",
 tip:"Открой вкладку «Перки», чтобы сравнить четыре эффекта: Скрытность, Поощрение, Благословение и Меткий удар. Перед матчем сверяй доступность и правила с текущей версией игры."
},
{
 id:"retribution",name:"Retribution",ru:"Возмездие",cat:"Jungle",
 stats:"Базовое заклинание лесника",
 desc:"Боевой навык для фарма лесных монстров и борьбы за нейтральные цели.",
 tip:"Выбирай заклинание лесника перед началом матча; после развития лесной экипировки доступен один из вариантов усиления."
},
{
 id:"ice-retribution",name:"Ice Retribution",ru:"Ледяное возмездие",cat:"Jungle",
 stats:"Замедление противника",
 desc:"Вариант усиления Возмездия, который помогает преследовать цель за счёт эффекта замедления.",
 tip:"Рассматривай, когда важно догнать противника или не дать ему уйти."
},
{
 id:"flame-retribution",name:"Flame Retribution",ru:"Пламенное возмездие",cat:"Jungle",
 stats:"Ослабление боевых характеристик цели",
 desc:"Вариант усиления Возмездия для давления на вражеского героя в бою.",
 tip:"Рассматривай, если нужно усилить дуэль против выбранной цели."
},
{
 id:"bloody-retribution",name:"Bloody Retribution",ru:"Кровавое возмездие",cat:"Jungle",
 stats:"Похищение здоровья",
 desc:"Вариант усиления Возмездия, ориентированный на дополнительную выживаемость при использовании против героя.",
 tip:"Рассматривай, если для твоего лесника важны выживаемость и продолжительный бой."
},
{
 id:"roam-conceal",name:"Conceal",ru:"Скрытность",cat:"Roam",
 stats:"Активный эффект · Командное перемещение",
 desc:"Роум-эффект, который помогает команде скрытно начать атаку или сменить позицию.",
 tip:"Используй для согласованного выхода на цель или неожиданного начала командного боя."
},
{
 id:"roam-encourage",name:"Encourage",ru:"Поощрение",cat:"Roam",
 stats:"Усиление союзников",
 desc:"Роум-эффект, ориентированный на поддержку союзников рядом с героем.",
 tip:"Выбирай, когда команде важнее усиление союзников в совместных столкновениях."
},
{
 id:"roam-favor",name:"Favor",ru:"Благословение",cat:"Roam",
 stats:"Поддержка и восстановление",
 desc:"Роум-эффект для героев поддержки, которым важно помогать союзникам восстанавливать здоровье.",
 tip:"Рассматривай на героях, чьи навыки хорошо сочетаются с лечением союзников."
},
{
 id:"roam-dire-hit",name:"Dire Hit",ru:"Меткий удар",cat:"Roam",
 stats:"Дополнительное давление на цель",
 desc:"Роум-эффект, ориентированный на усиление давления на противника при подходящих условиях.",
 tip:"Рассматривай, если команда хочет быстрее добивать выбранные цели."
},
{
 id:"gs",name:"Golden Staff",ru:"Золотой посох",cat:"Attack",
 stats:"Скорость атаки · Эффекты обычных атак",
 desc:"Предмет для некоторых сборок на скорость атаки и усиленные обычные атаки.",
 tip:"Проверяй совместимость пассивного эффекта с другими предметами в текущем патче."
},
{
 id:"lt",name:"Lightning Truncheon",ru:"Молниеносный трезубец",cat:"Magic",
 stats:"Магическая сила · Урон навыков",
 desc:"Магический предмет для некоторых сборок с частым использованием навыков.",
 tip:"Сверяй текущую механику эффекта и подбирай к набору навыков конкретного мага."
},
{
 id:"ch",name:"Cursed Helmet",ru:"Проклятый шлем",cat:"Defense",
 stats:"Здоровье · Магическая защита",
 desc:"Защитный предмет с дополнительным эффектом урона вокруг владельца.",
 tip:"Рассматривай для танков, которые долго находятся рядом с противниками; проверь параметры в игре."
},
{
 id:"gh",name:"Guardian Helmet",ru:"Шлем стража",cat:"Defense",
 stats:"Здоровье · Восстановление",
 desc:"Защитный предмет с акцентом на большой запас здоровья и восстановление вне боя.",
 tip:"Оцени, нужен ли дополнительный запас здоровья или лучше взять защиту от конкретного типа урона."
},
{
 id:"ba",name:"Blade Armor",ru:"Клинок брони",cat:"Defense",
 stats:"Физическая защита",
 desc:"Защитный предмет, который рассматривают против героев, полагающихся на обычные атаки.",
 tip:"Сравни с другими защитными предметами и проверяй актуальный эффект."
},
{
 id:"wa",name:"War Axe",ru:"Боевой топор",cat:"Attack",
 stats:"Физический урон · Бой на продолжительной дистанции",
 desc:"Атакующий предмет для некоторых бойцов и героев, которым выгодны затяжные столкновения.",
 tip:"Проверь, подходит ли его пассивный эффект темпу боя выбранного героя."
},
{
 id:"rgm",name:"Rose Gold Meteor",ru:"Метеор из розового золота",cat:"Attack",
 stats:"Физический урон · Защитный эффект",
 desc:"Атакующий предмет с дополнительной защитой в определённых ситуациях.",
 tip:"Рассматривай как ситуационный слот, если важен дополнительный запас на выживание."
},
{
 id:"qw",name:"Queen's Wings",ru:"Крылья королевы",cat:"Defense",
 stats:"Выживаемость в бою",
 desc:"Ситуативный предмет для некоторых бойцов, которым нужно переживать затяжной бой.",
 tip:"Проверь актуальные характеристики и пассивный эффект в клиенте игры."
},
{
 id:"sp",name:"Sky Piercer",ru:"Небесный пронзатель",cat:"Attack",
 stats:"Добивание целей",
 desc:"Ситуативный атакующий предмет, ориентированный на добивание противников.",
 tip:"Покупай только если текущая механика предмета и состояние матча оправдывают этот слот."
},
{
 id:"wt",name:"Windtalker",ru:"Ветрорез",cat:"Attack",
 stats:"Скорость атаки · Критические атаки",
 desc:"Предмет для некоторых сборок стрелков с упором на скорость атак и критические удары.",
 tip:"Сравнивай с другими вариантами критического урона и проверяй характеристики в текущем патче."
},
{
 id:"hcw",name:"Haas's Claws",ru:"Когти Хааса",cat:"Attack",
 stats:"Физический урон · Восстановление здоровья",
 desc:"Атакующий предмет для некоторых сборок, зависящих от обычных атак.",
 tip:"Проверь текущие свойства предмета и нужна ли герою дополнительная выживаемость."
},
{
 id:"ds",name:"Demon Boots",ru:"Демонические ботинки",cat:"Movement",
 stats:"Передвижение · Восстановление маны",
 desc:"Обувь для героев, которым важно поддерживать запас маны.",
 tip:"Сравни с обувью на пробивание или сокращение перезарядки."
},
{
 id:"cod",name:"Clock of Destiny",ru:"Часы судьбы",cat:"Magic",
 stats:"Магическая сила · Мана",
 desc:"Магический предмет для отдельных сборок; доступность и свойства следует сверять с текущим патчем.",
 tip:"Используй только если предмет доступен в твоей версии игры и подходит выбранному герою."
},
{
 id:"hs",name:"Hunter Strike",ru:"Удар охотника",cat:"Attack",
 stats:"Физическое пробивание · Передвижение",
 desc:"Физический атакующий предмет для некоторых героев, которым важно пробивание и мобильность.",
 tip:"Подбирай по стилю героя и актуальным характеристикам предмета."
},
{
 id:"flask",name:"Flask of the Oasis",ru:"Фляга оазиса",cat:"Defense",
 stats:"Поддержка · Усиление лечения и щитов",
 desc:"Предмет для некоторых сборок поддержки, связанных с лечением и щитами.",
 tip:"Проверь доступность предмета и его эффект в актуальной версии игры."
},
{
 id:"winter-crown",name:"Winter Crown",ru:"Корона зимы",cat:"Magic",
 stats:"Защита · Временная неуязвимость",
 desc:"Ситуативный защитный вариант для героев, которым важно пережить опасный момент.",
 tip:"Рассматривай против взрывного урона или контроля; проверь актуальный эффект в игре."
},
{
 id:"wind-of-nature",name:"Wind of Nature",ru:"Ветер природы",cat:"Attack",
 stats:"Защита от физического урона",
 desc:"Ситуативный предмет для стрелков против сильного физического урона.",
 tip:"Выбирай по угрозам соперника и сверяй доступность эффекта в текущем патче."
},
{
 id:"malefic-gun",name:"Malefic Gun",ru:"Зловещий пистолет",cat:"Attack",
 stats:"Дальность атак · Физический урон",
 desc:"Атакующий предмет для сборок, где важны дальность и физический урон.",
 tip:"Проверяй взаимодействие с героями дальнего боя и актуальные характеристики предмета."
}
];

const categories = {
  Attack:"Физический урон",
  Magic:"Магия",
  Defense:"Защита",
  Movement:"Передвижение",
  Jungle:"Лес",
  Roam:"Роум",
  Other:"Прочее"
};

const builds = [
{
 hero:"Фанни",role:"Лес · Убийца",
goal:"Мобильность и физический урон",
items:["Blade of the Heptaseas","Malefic Roar","Immortality"],
note:"Это пример направления сборки, а не универсальная последовательность покупок. Выбирай предметы по составу противника и состоянию матча."
},
{
 hero:"Вексана",role:"Мид · Маг",
goal:"Магический урон и пробивание",
items:["Holy Crystal","Divine Glaive","Immortality"],
note:"Сравни магические предметы с защитой и сокращением перезарядки. Конкретный порядок зависит от матча."
},
{
 hero:"Клод",role:"Голд · Стрелок",
goal:"Скорость атаки и урон по выносливым целям",
items:["Demon Hunter Sword","Corrosion Scythe","Immortality"],
note:"Это пример направления сборки. Проверяй актуальную совместимость предметов и адаптируй защиту под соперника."
},
{
 hero:"Белерик",role:"Роум · Танк",
goal:"Выживаемость и защита команды",
items:["Dominance Ice","Athena's Shield","Immortality"],
note:"Подбирай защиту под главный источник урона врагов. Не покупай все предметы без оценки состава команды."
}
];

let heroes = fallbackHeroes.map(h=>({...h}));
let heroDataSource = "fallback";
let heroQuery = "";
let activeRole = "Все";
let activeTier = "Все";
let activeTierRole = "Все";
let itemQuery = "";
let itemDataSource = "static";
let itemCategory = "Все";
let itemPurpose = "Все";
let itemSort = "default";
let itemOnlyFavorites = false;
let perkQuery = "";
let perkCategory = "Все";
let buildFilter = "Все";
let buildRoleFilter = "Все";
let buildQuery = "";
let buildHeroPickerQuery = "";
let favoriteTab = "heroes";
let favoriteHeroes = new Set();
let favoriteItems = new Set();
let toastTimer;

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}

function safeRead(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function safeWrite(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
    return true;
  } catch {
    showToast("Браузер не разрешил сохранить изменения.");
    return false;
  }
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"),2600);
}

function getHeroClasses(hero) {
  const roles = Array.isArray(hero.roles) && hero.roles.length
    ? hero.roles
    : String(hero.role || "").split("/");
  const translated = roles
    .map(role => roleTranslations[String(role).trim().toLowerCase()] || String(role).trim())
    .filter(Boolean);
  return [...new Set(translated.length ? translated : ["Роль не указана"])];
}

// Russian aliases make the hero catalogue searchable in the language used by the interface.
const HERO_SEARCH_ALIASES = {
  aamon:"аамон", akai:"акай", alice:"алиса", alpha:"альфа", alucard:"алукард",
  angela:"ангела", argus:"аргус", atlas:"атлас", aurora:"аврора", badang:"баданг",
  balmond:"балмонд", bane:"бейн", beatrix:"беатрис", belerick:"белерик", benedetta:"бенедетта",
  brody:"броуди", bruno:"бруно", carmilla:"кармилла", cecilion:"сесилион", change:"чанъэ",
  chou:"чу", cici:"цзицзи", claude:"клод", clint:"клинт", cyclops:"циклоп", diggie:"дигги",
  dyrroth:"диррот", edith:"эдит", esmeralda:"эсмеральда", estes:"эстес", eudora:"эудора",
  fanny:"фанни", faramis:"фарамис", floryn:"флорин", franco:"франко", fredrinn:"фредринн",
  freya:"фрея", gatotkaca:"гатоткача", gloo:"глу", gord:"горд", granger:"грейнджер",
  grock:"грок", guinevere:"гвиневра", gusion:"госсен гусион", hanabi:"ханаби", hanzo:"ханзо",
  harith:"харит", harley:"харли", hayabusa:"хаябуса", helcurt:"хелкарт", hilda:"хильда",
  hylos:"хилос", irithel:"иритэль", jawhead:"джавхед", johnson:"джонсон", joy:"джой",
  julian:"джулиан", kadita:"кадита", kagura:"кагура", kaja:"кайя", karina:"карина",
  karrie:"кэрри карри", khaleed:"халид", khufra:"хуфра", kimmy:"кимми", lancelot:"ланселот",
  lapulapu:"лапу лапу", layla:"лейла", lesley:"лесли", ling:"линг", lolita:"лолита",
  lunox:"люнокс", luoyi:"ло йи", lylia:"лилия", martis:"мартис", masha:"маша",
  mathilda:"матильда", melissa:"мелисса", miya:"мия", moskov:"москов", nana:"нана",
  natalia:"наталья", natan:"натан", nolan:"нолан", novaria:"новария", odette:"одэтт одетта",
  paquito:"пакито", pharsa:"фарса", phoveus:"фовиус", rafaela:"рафаэль", roger:"роджер",
  ruby:"руби", saber:"сейбер сабер", selena:"селена", silvanna:"сильванна", sun:"сан",
  suyou:"су ю", terizla:"теризла", thamuz:"тамуз", tigreal:"тигрил", uranus:"уранус",
  vale:"вэйл", valentina:"валентина", valir:"валир", vexana:"вексана", wanwan:"ванван",
  xborg:"икс борг иксборг", xavier:"ксавьер", yin:"инь", yisunshin:"ли сун син",
  yuzhong:"юй чжун", yve:"ив", zhask:"жаск", zilong:"зилонг", chip:"чип", kalea:"калеа",
  lukas:"лукас", marcel:"марсель", melissa:"мелисса", nolan:"нолан", obsidia:"обсидия",
  sora:"сора", zetian:"цзэтянь", zhuxin:"чжусин"
};
function heroSearchKey(value) {
  return String(value || "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function itemIconSlug(name) {
  const overrides = {
    "Magic Boots":"magic_boots",
    "Demon Boots":"demon_boots",
    "Retribution":"retribution",
    "Ice Retribution":"ice_retribution",
    "Flame Retribution":"flame_retribution",
    "Bloody Retribution":"bloody_retribution",
    "Conceal":"conceal",
    "Encourage":"encourage",
    "Favor":"favor",
    "Dire Hit":"dire_hit"
  };
  if (Object.prototype.hasOwnProperty.call(overrides,name)) return overrides[name];
  return String(name)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRemoteHero(hero,index) {
  const name = hero.name_hero || hero.name || hero.nameHero || hero.hero_name;
  if (!name) return null;

  const sourceRoles = Array.isArray(hero.role)
    ? hero.role
    : Array.isArray(hero.roles) ? hero.roles
    : typeof hero.role === "string" ? [hero.role] : [];

  // Некоторые внешние записи объединяют несколько классов в одну строку.
  const roleText = sourceRoles
    .flatMap(role => String(role).split(/[\\/,|]/))
    .map(role => role.trim().toLowerCase())
    .filter(Boolean);
  const translatedRoles = roleText.map(role=>roleTranslations[role] || role);
  const fallbackMatch = fallbackHeroes.find(h=>h.name.toLowerCase()===String(name).toLowerCase());
  const filename = hero["images-hero"] || hero.image || hero.image_url || "";
  const catalogImage = filename && /^https?:\/\//i.test(filename)
    ? filename
    : filename ? HERO_IMAGE_BASE + String(filename).replace(/^images-hero\//, "").split("/").map(part => encodeURIComponent(part)).join("/")
    : heroImageUrl(name);
  const hdImage = heroHDImageUrl(name);

  return {
    id:fallbackMatch ? String(fallbackMatch.id) : String(hero.id_hero ?? hero.id ?? "remote-"+index),
    name:String(name),
    role:translatedRoles.join(" / ") || "Роль не указана",
    image:hdImage || catalogImage,
    fallbackImage:catalogImage,
    roles:roleText
  };
}

function heroInitialJS(name) {
  const character = String((name || "?").slice(0, 1).toUpperCase());
  // Event-handler attributes are double-quoted HTML. Keep both quote characters
  // out of the embedded JavaScript string literal so failed-image fallbacks parse.
  return "'" + character
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\x27")
    .replace(/"/g, "\\x22")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n") + "'";
}

function heroImageMarkup(hero) {
  const initial = escapeHTML((hero.name || "?").slice(0,1).toUpperCase());
  const initialJS = heroInitialJS(hero.name);
  if (!hero.image) {
    return `<div class="hero-image-fallback" role="img" aria-label="Изображение героя недоступно">${initial}</div>`;
  }
  const retryImage = hero.fallbackImage && hero.fallbackImage !== hero.image
    ? hero.fallbackImage
    : heroImageUrl(hero.name);
  const splashPath = HERO_SPLASH_ART_OVERRIDES[heroImageKey(hero.name)];
  const directSplashFallback = String(hero.image).includes("images.weserv.nl") && splashPath
    ? heroSplashDirectImageUrl(splashPath)
    : "";
  const imageType = String(hero.image).includes("images.weserv.nl")
    ? "hero-image--splash"
    : String(hero.image).includes("Lara_Image")
      ? "hero-image--portrait"
      : "hero-image--avatar";
  const keepSquarePortrait = ["arlott", "atlas", "badang"].includes(heroImageKey(hero.name));
  const shapeFallback = String(hero.image).includes("Lara_Image") && splashPath && !keepSquarePortrait
    ? heroSplashImageUrl(splashPath)
    : "";
  return `<img class="hero-image ${imageType}" src="${escapeHTML(hero.image)}" data-shape-fallback="${escapeHTML(shapeFallback)}" data-retry="${escapeHTML(directSplashFallback || retryImage)}" data-retry2="${escapeHTML(directSplashFallback ? retryImage : "")}" onload="if(this.classList.contains('hero-image--portrait') && this.naturalWidth > this.naturalHeight * 0.82 && this.dataset.shapeFallback){const next=this.dataset.shapeFallback;this.dataset.shapeFallback='';this.classList.remove('hero-image--portrait');this.classList.add('hero-image--splash');this.src=next;}" alt="${escapeHTML(hero.name)}" loading="lazy" decoding="async" fetchpriority="low" onerror="if(this.dataset.retry && this.dataset.retry!==this.src){const next=this.dataset.retry;this.dataset.retry='';this.classList.remove('hero-image--splash','hero-image--portrait');this.classList.add('hero-image--avatar');this.src=next;}else if(this.dataset.retry2 && this.dataset.retry2!==this.src){const next=this.dataset.retry2;this.dataset.retry2='';this.src=next;}else{this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'hero-image-fallback',textContent:${initialJS},role:'img',ariaLabel:'Изображение героя недоступно'}))}">`;
}


/* Circular catalog/selector portraits use square in-game icons so every hero fills
   the same frame. Keep the already-approved Aamon, Alpha and Alucard artwork unchanged. */
function heroCircleImageMarkup(hero) {
  const key = heroImageKey(hero.name);
  if (["aamon", "alpha", "alucard"].includes(key)) return heroImageMarkup(hero);
  const initial = escapeHTML((hero.name || "?").slice(0, 1).toUpperCase());
  const initialJS = heroInitialJS(hero.name);
  const primaryImage = heroImageUrl(hero.name) || hero.image || heroHDImageUrl(hero.name);
  const retryCandidates = [hero.image, hero.fallbackImage, heroHDImageUrl(hero.name)].filter(src => src && src !== primaryImage);
  const retryImage = retryCandidates[0] || "";
  return `<img class="hero-image hero-image--avatar hero-image--circle-icon" src="${escapeHTML(primaryImage)}" data-retry="${escapeHTML(retryImage)}" alt="${escapeHTML(hero.name)}" loading="lazy" decoding="async" fetchpriority="low" onerror="if(this.dataset.retry && this.dataset.retry!==this.src){const next=this.dataset.retry;this.dataset.retry='';this.src=next;}else{this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'hero-image-fallback',textContent:${initialJS},role:'img',ariaLabel:'Изображение героя недоступно'}))}">`;
}

function favoriteButton(type,id,saved) {
  return `<button type="button" class="favorite-btn ${saved?"saved":""}" data-favorite-type="${type}" data-favorite-id="${escapeHTML(id)}" aria-pressed="${saved}">${saved?"★ В избранном":"☆ В избранное"}</button>`;
}

function hero3DModelUrl(hero) {
  const slug = String(hero?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/&/g, "-and-")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return "https://mlbb.tools/heroes/" + slug + "/model";
}

let activeDetailHeroId = "";

function getHeroById(id) {
  return heroes.find(hero => String(hero.id) === String(id)) || null;
}

function talentIconMarkupForBuild(name, index) {
  const renderer = window.GrimGGTalentData?.iconMarkup;
  if (typeof renderer === "function") return renderer(name, index);
  const glyph = ["✦", "⬡", "◈"][index] || "✦";
  return '<span class="talent-icon talent-icon-art" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M32 4 54 17v30L32 60 10 47V17Z" fill="#21131d" stroke="#ff8795" stroke-width="2"/><text x="32" y="41" text-anchor="middle" font-size="27" font-family="Arial,sans-serif" font-weight="700" fill="#ffe6eb">' + glyph + '</text></svg></span>';
}

const BATTLE_SPELL_ICON_BASE = "https://mlbbhub.com/images/spells/";
const BATTLE_SPELL_ICON_RULES = [
  {slug:"flicker", names:["вспышка","flicker"]},
  {slug:"retribution", names:["возмездие","retribution"]},
  {slug:"inspire", names:["вдохновение","inspire"]},
  {slug:"execute", names:["исполнение","казнь","execute"]},
  {slug:"revitalize", names:["исцеление","восстановление","revitalize"]},
  {slug:"sprint", names:["спринт","sprint"]},
  {slug:"aegis", names:["щит","aegis"]},
  {slug:"petrify", names:["окаменение","petrify"]},
  {slug:"purify", names:["очищение","purify"]},
  {slug:"flameshot", names:["огненный выстрел","пылающий выстрел","flameshot"]},
  {slug:"vengeance", names:["возмездие духа","vengeance","мщение"]},
  {slug:"arrival", names:["прибытие","arrival"]}
];
function battleSpellMarkup(spellText) {
  const label = String(spellText || "Выбери боевой навык под героя и матч.");
  const normalized = label.toLocaleLowerCase("ru");
  const matched = BATTLE_SPELL_ICON_RULES.filter(rule =>
    rule.names.some(name => normalized.includes(name))
  );
  // "Возмездие духа" is Vengeance, not jungle Retribution.
  const safeMatched = matched.filter(rule => !(rule.slug === "retribution" && normalized.includes("возмездие духа")));
  const icons = safeMatched.map(rule =>
    '<img class="build-spell-icon" src="' + escapeHTML(BATTLE_SPELL_ICON_BASE + rule.slug + '.png') +
    '" alt="' + escapeHTML(rule.names[0]) + '" title="' + escapeHTML(rule.names[0]) +
    '" loading="lazy" decoding="async" onerror="this.onerror=null;this.remove();">'
  ).join("");
  return '<span class="build-spell-display">' + icons +
    '<span>' + escapeHTML(label) + '</span></span>';
}

function getHeroTalentPreset(heroName, roles, style = "Командные бои") {
  const role = resolveBuildRole(roles);
  const data = window.GrimGGTalentData;
  const rolePresets = data?.recommendations?.[role];
  const selectedStyle = rolePresets?.[style] ? style : (rolePresets ? Object.keys(rolePresets)[0] : null);
  const talents = selectedStyle && rolePresets ? rolePresets[selectedStyle] : [];
  return {
    role,
    style: selectedStyle || style,
    emblem: data?.emblemNames?.[role] || roleBuildTemplates[role]?.emblem || "Эмблема под роль героя",
    talents: Array.isArray(talents) ? talents : []
  };
}

const lateGameItemChoices = {
  "Clint":["Wind of Nature","Sea Halberd","Blade of the Heptaseas","Rose Gold Meteor"],
  "Fanny":["Sky Piercer","Hunter Strike","Athena's Shield","Blade of Despair"],
  "Claude":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Belerick":["Blade Armor","Radiant Armor","Athena's Shield","Guardian Helmet"],
  "Miya":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Layla":["Wind of Nature","Rose Gold Meteor","Sea Halberd","Blade of Despair"],
  "Bruno":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Brody":["Wind of Nature","Rose Gold Meteor","Hunter Strike","Blade of Despair"],
  "Moskov":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Karrie":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Beatrix":["Wind of Nature","Rose Gold Meteor","Blade of Despair","Hunter Strike"],
  "Vexana":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Nana":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Eudora":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Aurora":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Odette":["Winter Crown","Genius Wand","Holy Crystal","Athena's Shield"],
  "Cecilion":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Lylia":["Winter Crown","Blood Wings","Glowing Wand","Athena's Shield"],
  "Kagura":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Terizla":["Blade Armor","Radiant Armor","Athena's Shield","Guardian Helmet"],
  "Ruby":["Blade Armor","Athena's Shield","Radiant Armor","Guardian Helmet"],
  "Dyrroth":["Rose Gold Meteor","Queen's Wings","Wind of Nature","Immortality"],
  "Yu Zhong":["Blade Armor","Athena's Shield","Radiant Armor","Guardian Helmet"],
  "Alpha":["Dominance Ice","Athena's Shield","Blade Armor","Guardian Helmet"],
  "Balmond":["Dominance Ice","Athena's Shield","Blade Armor","Guardian Helmet"],
  "Fredrinn":["Blade Armor","Guardian Helmet","Radiant Armor","Dominance Ice"],
  "Tigreal":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Khufra":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Atlas":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Franco":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Lolita":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Angela":["Flask of the Oasis","Winter Crown","Guardian Helmet","Immortality"],
  "Estes":["Flask of the Oasis","Winter Crown","Guardian Helmet","Immortality"],
  "Diggie":["Winter Crown","Guardian Helmet","Oracle","Athena's Shield"],
  "Sun":["Wind of Nature","Rose Gold Meteor","Sea Halberd","Queen's Wings"],
  "Kadita":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Gusion":["Rose Gold Meteor","Immortality","Sky Piercer","Hunter Strike"],
  "Ling":["Rose Gold Meteor","Immortality","Malefic Roar","Hunter Strike"],
  "Saber":["Rose Gold Meteor","Immortality","Blade of Despair","Hunter Strike"],
  "Lancelot":["Rose Gold Meteor","Immortality","Sky Piercer","Malefic Roar"],
  "Hayabusa":["Rose Gold Meteor","Immortality","Malefic Roar","Hunter Strike"],
  "Alucard":["Rose Gold Meteor","Queen's Wings","Immortality","Sea Halberd"],
  "Chou":["Rose Gold Meteor","Blade Armor","Athena's Shield","Immortality"],
  "X.Borg":["Immortality","Athena's Shield","Radiant Armor","Queen's Wings"],
  "Paquito":["Rose Gold Meteor","Immortality","Queen's Wings","Hunter Strike"],
  "Aamon":["Rose Gold Meteor","Immortality","Sky Piercer","Hunter Strike"],
  "Julian":["Winter Crown","Rose Gold Meteor","Immortality","Divine Glaive"],
  "Lunox":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Luo Yi":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Xavier":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Pharsa":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Cyclops":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield"],
  "Harith":["Winter Crown","Rose Gold Meteor","Blood Wings","Athena's Shield"],
  "Melissa":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Ixia":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Wanwan":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Hanabi":["Wind of Nature","Sea Halberd","Rose Gold Meteor","Blade of Despair"],
  "Minotaur":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Floryn":["Flask of the Oasis","Winter Crown","Guardian Helmet","Immortality"],
  "Mathilda":["Flask of the Oasis","Winter Crown","Guardian Helmet","Immortality"],
  "Johnson":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Akai":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Hylos":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"],
  "Grock":["Blade Armor","Radiant Armor","Guardian Helmet","Immortality"]
};
const lateGameRoleChoices = {
  "Убийца":["Rose Gold Meteor","Immortality","Sky Piercer","Hunter Strike","Malefic Roar"],
  "Маг":["Winter Crown","Blood Wings","Genius Wand","Athena's Shield","Divine Glaive"],
  "Стрелок":["Wind of Nature","Rose Gold Meteor","Sea Halberd","Blade of Despair","Immortality"],
  "Боец":["Queen's Wings","Rose Gold Meteor","Athena's Shield","Blade Armor","Immortality"],
  "Танк":["Blade Armor","Radiant Armor","Guardian Helmet","Athena's Shield","Immortality"],
  "Поддержка":["Flask of the Oasis","Winter Crown","Oracle","Athena's Shield","Immortality"]
};
function getLateGameItems(heroName, roles, build) {
  const role = resolveBuildRole(roles);
  const candidates = [
    ...(lateGameItemChoices[heroName] || []),
    ...(lateGameRoleChoices[role] || lateGameRoleChoices["Боец"]),
    "Immortality","Rose Gold Meteor","Athena's Shield","Blade Armor","Winter Crown"
  ];
  const current = new Set((build?.items || []).map(name=>String(name).toLowerCase()));
  const unique = [];
  for (const name of candidates) {
    if (!items.some(item=>item.name===name) || current.has(name.toLowerCase()) || unique.includes(name)) continue;
    unique.push(name);
    if (unique.length === 2) break;
  }
  return unique;
}

function renderHeroDetailContent(hero, target) {
  if (!hero || !target) return;
  const roles = getHeroClasses(hero);
  const tip = heroTips[hero.name] || "Учитывай дальность навыков, следи за мини-картой и подстраивай тактику под состав команды соперника.";
  const headingId = target.id === "heroDetailModalContent" ? "heroDetailModalTitle" : "heroDetailPageTitle";
  const profilePrefix = target.id === "heroDetailModalContent" ? "modal" : "profile";
  const build = getHeroBuild(hero.name, roles);
  const buildRows = build.items.map((name,index)=>{
    const item = items.find(entry=>entry.name===name);
    const iconSlug = item ? itemIconSlug(item.name) : itemIconSlug(name);
    const iconUrl = item && item.imageFile ? ITEM_IMAGE_BASE + item.imageFile : iconSlug ? ITEM_IMAGE_BASE + iconSlug + ".png" : "";
    const icon = iconUrl ? `<img class="build-item-icon" src="${escapeHTML(iconUrl)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'build-item-icon-fallback',textContent:'⚔'}))">` : '<span class="build-item-icon-fallback">⚔</span>';
    return `<div class="build-item-row"><span class="hero-build-order">0${index+1}</span>${icon}<div><strong>${escapeHTML(item?item.ru:name)}</strong><span>${escapeHTML(item?item.stats:"Проверь предмет в актуальной версии игры.")}</span></div></div>`;
  }).join("");
  const lateGameItems = getLateGameItems(hero.name, roles, build);
  const lateGameRows = lateGameItems.map(name=>{
    const item = items.find(entry=>entry.name===name);
    const iconSlug = item ? itemIconSlug(item.name) : itemIconSlug(name);
    const iconUrl = item && item.imageFile ? ITEM_IMAGE_BASE + item.imageFile : ITEM_IMAGE_BASE + iconSlug + ".png";
    const icon = `<img class="late-game-item-icon" src="${escapeHTML(iconUrl)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'late-game-item-fallback',textContent:'⚔'}))">`;
    return `<div class="late-game-item-card">${icon}<span>${escapeHTML(item?item.ru:name)}</span></div>`;
  }).join("");
  const talentRoleDefaults = {
    "Убийца": "Приоритет: физический урон и пробивание; дополнительный талант — под быстрое устранение тонких целей. Для леса выбирай настройки, усиливающие темп фарма и ранние ганги.",
    "Маг": "Приоритет: магическое пробивание и урон навыков; дополнительный талант — под перезарядку или устойчивость, если часто ловят.",
    "Стрелок": "Приоритет: усиление обычных атак и подходящие характеристики (скорость атаки или критический урон). Выбирай последний талант под конкретного стрелка.",
    "Боец": "Приоритет: урон в продолжительном бою и устойчивость. Для взрывного героя смещай выбор в сторону физического урона и пробивания.",
    "Танк": "Приоритет: выживаемость и командная польза; выбирай дополнительный талант под контроль, начало боя или восстановление.",
    "Поддержка": "Приоритет: командная польза, восстановление и сокращение перезарядки; подстраивай выбор под лечение, щиты и контроль героя."
  };
  const talentPreset = getHeroTalentPreset(hero.name, roles);
  const talentText = build.talents || talentRoleDefaults[resolveBuildRole(roles)] || talentRoleDefaults["Боец"];
  const emblemText = build.emblem || talentPreset.emblem || "Выбери эмблему под роль и механику героя.";
  const spellText = build.spell || roleBuildTemplates[resolveBuildRole(roles)]?.spell || "Боевой навык выбирай под роль и состав соперника.";
  const talentCards = talentPreset.talents.length
    ? talentPreset.talents.map((talent,index)=>`<article class="hero-talent-pick"><span class="hero-talent-pick-num">${["ТАЛАНТ I","ТАЛАНТ II","КЛЮЧЕВОЙ"][index] || "ТАЛАНТ"}</span><div class="hero-talent-pick-icon" aria-hidden="true">${talentIconMarkupForBuild(talent[1],index)}</div><div><strong>${escapeHTML(talent[1])}</strong><p>${escapeHTML(talent[2])}</p></div></article>`).join("")
    : `<p>${escapeHTML(talentText)}</p>`;
  const talentSection = `<div id="${profilePrefix}-hero-talents" class="hero-detail-section hero-talents-section">
    <span class="eyebrow">MLBB GAME / EMBLEM & TALENTS</span>
    <h3>Эмблема, таланты и боевой навык</h3>
    <div class="hero-talent-grid">
      <div class="hero-talent-card"><span class="hero-talent-label">Эмблема</span><p>${escapeHTML(emblemText)}</p></div>
      <div class="hero-talent-card hero-talent-card-picks"><span class="hero-talent-label">Таланты · ${escapeHTML(talentPreset.style)}</span><div class="hero-talent-picks">${talentCards}</div></div>
      <div class="hero-talent-card"><span class="hero-talent-label">Боевой навык</span>${battleSpellMarkup(spellText)}</div>
    </div>
    <p class="fine-print">Это стартовый вариант по роли и стилю, а не гарантированная мета-сборка для каждого героя. Сверяй эффекты талантов с текущей версией MLBB и меняй выбор под матч.</p>
    <div class="hero-talent-footer-actions">
      <a class="btn btn-3d" href="${escapeHTML(hero3DModelUrl(hero))}" target="_blank" rel="noopener noreferrer" aria-label="Открыть 3D-модель героя ${escapeHTML(hero.name)}">◈ 3D-модель ↗</a>
      <a class="btn btn-ghost" href="?page=guides">Комбо и гайды ↗</a>
    </div>
  </div>`;
  const combo = comboGuides.find(entry => String(entry.key || entry.hero).toLocaleLowerCase() === String(hero.name).toLocaleLowerCase());
  const skillsSection = combo
    ? `<div id="${profilePrefix}-hero-skills" class="hero-detail-section"><h3>Навыки и комбо</h3><p class="fine-print">Комбо: ${combo.skills.map(escapeHTML).join(" → ")}</p><ol class="hero-skill-steps">${combo.steps.map(step=>`<li>${escapeHTML(step)}</li>`).join("")}</ol><p>${escapeHTML(combo.tip)}</p></div>`
    : `<div id="${profilePrefix}-hero-skills" class="hero-detail-section"><h3>Навыки героя</h3><p class="fine-print">Подробные описания навыков этого героя ещё не подключены к справочнику. Не показываем выдуманные данные.</p><a class="btn btn-ghost" href="?page=guides">Открыть комбо и гайды ↗</a></div>`;
  const buildSection = `<div id="${profilePrefix}-hero-build" class="hero-detail-section hero-build-inline">
    <div class="hero-build-inline-heading"><div><span class="eyebrow">MLBB GAME / BUILD</span><h3>Сборка героя</h3></div><p>${escapeHTML(build.goal)}</p></div>
    <div class="build-item-list">${buildRows}</div>
    <p class="fine-print">${build.personalized ? "Подборка для конкретного героя." : "Стартовый шаблон по роли; не индивидуальная мета-сборка."} ${escapeHTML(build.note)}</p>
    <div class="hero-late-game">
      <h4>Предметы на замену в лейт-гейме</h4>
      <div class="late-game-item-list">${lateGameRows}</div>
      <p>В конце игры можно продать менее полезный предмет и заменить его одним из этих вариантов.</p>
    </div>
    <button type="button" class="btn btn-red" data-open-build="${escapeHTML(hero.name)}" data-build-roles="${escapeHTML(roles.join(","))}">Другие варианты сборки ↗</button>
  </div>`;
  const profileQuickNav = target.id === "heroDetailPage" ? `
    <nav class="hero-profile-jump-links" aria-label="Быстрый переход по профилю героя">
      <a class="hero-profile-jump-primary" href="#profile-hero-build"><span aria-hidden="true">⚔</span> Сборка</a>
      <a class="hero-profile-jump-primary" href="#profile-hero-talents"><span aria-hidden="true">✦</span> Эмблема и таланты</a>
      <a class="hero-profile-jump-secondary" href="#profile-hero-skills"><span aria-hidden="true">⌁</span> Навыки и комбо</a>
    </nav>` : "";
  target.innerHTML = `
    <div class="hero-detail-layout">
      <div class="hero-detail-art">${heroImageMarkup(hero)}</div>
      <div class="hero-detail-copy">
        <span class="eyebrow">MLBB GAME / HERO PROFILE</span>
        <h2 class="hero-profile-name" id="${headingId}">
          <span class="hero-profile-name-avatar" aria-hidden="true">${heroImageMarkup(hero).replace('class="hero-image ', 'class="hero-image hero-profile-avatar ').replace('class="hero-image-fallback"', 'class="hero-image-fallback hero-profile-avatar-fallback"')}</span>
          <span class="hero-profile-name-text">${escapeHTML(hero.name)}</span>
        </h2>
        <p class="hero-role">${escapeHTML(hero.role || roles.join(" / "))}</p>
        <div class="hero-tags">${roles.map(role=>`<span>${escapeHTML(role)}</span>`).join("")}</div>
        <div class="hero-detail-actions">
          ${favoriteButton("hero",String(hero.id),favoriteHeroes.has(String(hero.id)))}
        </div>
      </div>
    </div>
    ${profileQuickNav}
    ${buildSection}
    ${talentSection}
    ${skillsSection}
    <div class="hero-detail-section hero-detail-tip hero-detail-tip-bottom"><strong>Совет MLBB Game</strong><p>${escapeHTML(tip)}</p></div>`;
}

function renderHeroFullPage(name) {
  const target = $("heroDetailPage");
  if (!target) return;
  const hero = heroes.find(entry => entry.name.toLocaleLowerCase() === String(name || "").toLocaleLowerCase());
  if (!hero) {
    target.innerHTML = '<div class="empty-state"><strong>Герой не найден</strong><p>Вернись в каталог и выбери героя ещё раз.</p><a class="btn btn-ghost" href="?page=heroes">Вернуться к героям</a></div>';
    return;
  }
  activeDetailHeroId = String(hero.id);
  renderHeroDetailContent(hero,target);
}

function openHeroDetail(id) {
  const hero = getHeroById(id);
  const modal = $("heroDetailModal");
  const content = $("heroDetailModalContent");
  if (!hero || !modal || !content) return;
  activeDetailHeroId = String(hero.id);
  renderHeroDetailContent(hero,content);
  modal.hidden = false;
  if ($("buildModal")) $("buildModal").hidden = true;
  document.body.classList.add("modal-open");
  modal.querySelector(".hero-detail-close")?.focus();
}

function closeHeroDetail() {
  const modal = $("heroDetailModal");
  if (!modal) return;
  modal.hidden = true;
  if ($("buildModal")?.hidden !== false) document.body.classList.remove("modal-open");
}

function renderQuickHeroSearch() {
  const input = $("quickHeroSearch");
  const results = $("quickHeroResults");
  if (!input || !results) return;

  const query = input.value.trim().toLocaleLowerCase();
  if (query.length < 2) {
    results.hidden = true;
    results.replaceChildren();
    return;
  }

  const matched = heroes.filter(hero => {
    const name = String(hero.name || "");
    const aliases = HERO_SEARCH_ALIASES[heroSearchKey(name)] || "";
    const roles = getHeroClasses(hero).join(" ");
    return (name + " " + aliases + " " + roles).toLocaleLowerCase().includes(query);
  }).slice(0, 6);

  if (!matched.length) {
    results.innerHTML = '<div class="quick-hero-empty">Ничего не найдено. Попробуй другое имя или роль.</div>';
    results.hidden = false;
    return;
  }

  results.innerHTML = matched.map(hero => {
    const name = escapeHTML(hero.name);
    const roles = escapeHTML(getHeroClasses(hero).join(" · "));
    return '<button class="quick-hero-result" type="button" role="option" aria-label="Открыть профиль героя ' + name + '" data-open-hero-full="' + name + '">' +
      '<span><strong>' + name + '</strong><small>' + roles + ' · профиль и сборка</small></span>' +
      '<span class="quick-result-action">ОТКРЫТЬ ↗</span></button>';
  }).join("");
  results.hidden = false;
}

function renderHeroes() {
  const grid = $("heroGrid");
  if (!grid) return;

  const roleFilters = $("roleFilters");
  if (roleFilters) {
    roleFilters.querySelectorAll("[data-role-count]").forEach(button => {
      const role = button.dataset.roleCount;
      const count = role === "Все" ? heroes.length : heroes.filter(hero => getHeroClasses(hero).includes(role)).length;
      const output = button.querySelector(".role-count");
      if (output) output.textContent = String(count);
    });
  }

  const filtered = heroes.filter(hero => {
    const name = String(hero.name || "").toLocaleLowerCase();
    const alias = HERO_SEARCH_ALIASES[heroSearchKey(hero.name)] || "";
    const searchable = (name + " " + alias).toLocaleLowerCase();
    return (activeRole === "Все" || getHeroClasses(hero).includes(activeRole))
      && searchable.includes(heroQuery);
  });

  $("heroCount").textContent = `Показано: ${filtered.length}. ${heroDataSource === "fallback" ? "Показан сокращённый встроенный список: он не является полным каталогом." : "Роли взяты из стороннего каталога сообщества и не означают, что герой рекомендован для указанной линии."}`;

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-state">Герои не найдены. Попробуй другой поиск или роль.</p>';
    return;
  }

  grid.innerHTML = filtered.map(hero=>{
    const id = String(hero.id);
    const saved = favoriteHeroes.has(id);
    const heroClasses = getHeroClasses(hero);
    const tip = heroTips[hero.name] ||
      "Учитывай дальность навыков, следи за мини-картой и подстраивай тактику под состав команды соперника.";

    return `<article class="hero-card">
      <div class="hero-image-wrap">
        <button type="button" class="hero-image-open" data-open-hero-full="${escapeHTML(hero.name)}" aria-label="Открыть сборку и таланты героя ${escapeHTML(hero.name)}">
          ${heroCircleImageMarkup(hero)}
        </button>
      </div>
      <div class="hero-card-content">
        <h3><button type="button" class="hero-name-open" data-open-hero-full="${escapeHTML(hero.name)}">${escapeHTML(hero.name)}</button></h3>
        <p class="hero-role">${escapeHTML(hero.role || getHeroClasses(hero).join(" / "))}</p>
        <div class="hero-tags">${heroClasses.map(role=>`<span>${escapeHTML(role)}</span>`).join("")}</div>
        <div class="hero-card-actions">
          <button type="button" class="btn btn-red hero-build-btn" data-open-hero-full="${escapeHTML(hero.name)}">Сборка и таланты ↗</button>
          <a class="btn btn-3d hero-card-3d" href="${escapeHTML(hero3DModelUrl(hero))}" target="_blank" rel="noopener noreferrer" aria-label="Открыть 3D-модель героя ${escapeHTML(hero.name)}">◈ 3D-модель</a>
        </div>
        <details><summary>Игровой совет ↗</summary><p>${escapeHTML(tip)}</p></details>
        ${favoriteButton("hero",id,saved)}
      </div>
    </article>`;
  }).join("");
}


const tierHighlights = {
  Fanny:{reason:"Очень высокий механический потолок, но в общей статистике всех рангов её результат сейчас низкий; в высоких рангах оценка может отличаться."},
  Ling:{reason:"Сильный мобильный лесник, но требует хорошей механики и решений по карте."},
  Vexana:{reason:"Контроль и урон по области полезны, но текущая общая статистика не относит её к верхнему тир-уровню."},
  Claude:{reason:"Сильно масштабируется с предметами, однако нуждается в фарме и защите."},
  Khufra:{reason:"Сильный роум-танк: контроль и противодействие рывкам особенно ценны против мобильных соперников."},
  Belerick:{reason:"Выносливый роум-танк, особенно полезный против героев с частыми базовыми атаками."},
  Ruby:{reason:"Контроль и восстановление помогают в затяжных боях, но эффективность зависит от состава соперника."},
  Xavier:{reason:"Дальность навыков и контроль полезны, но текущая статистика не ставит его в число лидеров."},
  Karrie:{reason:"Может хорошо разбирать выносливые цели, однако общая статистика сейчас ниже среднего."},
  Diggie:{reason:"Особенно полезен против составов, зависящих от контроля; в текущем срезе относится к сильным выборам."},
  Terizla:{reason:"Выносливость и контроль по области хороши в командных боях; текущий рейтинг — средний."},
  Tigreal:{reason:"Сильное начало боя зависит от позиции и координации; текущая общая статистика низкая."},
  Chou:{reason:"Может изолировать важную цель, но текущая общая статистика показывает слабый результат."},
  Miya:{reason:"Хорошо масштабируется, но уязвима без прикрытия; текущая общая статистика ниже среднего."},
  Layla:{reason:"Высокая дальность помогает в поздней игре, но выживание и позиционирование критичны."},
  Eudora:{reason:"Опасна при удачной комбинации и часто блокируется, хотя недавний балансный патч снизил её урон."},
  Nana:{reason:"Контроль полезен, но текущая общая статистика указывает на ситуативный выбор."},
  Saber:{reason:"Опасен против одиночных целей, но уязвим против сгруппированной команды."},
  Alucard:{reason:"Нуждается в хорошем входе в бой; текущая общая статистика показывает низкую эффективность."},
  Hanabi:{reason:"Сильнее в командных боях при прикрытии; в текущем срезе относится к сильным выборам."},
  Gusion:{reason:"Высокий потенциал быстрого урона при хорошем исполнении, но по общей статистике результаты сейчас невысоки."},
  Faramis:{reason:"Командная поддержка может перевернуть бой; общая статистика находится около среднего."},
  Lolita:{reason:"Защита от снарядов и контроль полезны; текущая статистика относит её к сильным выборам."}
};

const CURRENT_PATCH_TIER_GROUPS = {
  S:["Masha","Aulus","Rafaela","Marcel","Argus","Minotaur","Khufra","Popol and Kupa","Gloo","Floryn","Carmilla","Obsidia","Hirara"],
  A:["Lolita","Valir","Diggie","Bruno","Gord","Lukas","Estes","Edith","Benedetta","Irithel","Ling","Zhask","Sun","Hanabi","Belerick","Atlas","Barats","Kagura","Eudora","Minsitthar","Guinevere","Kadita","Zetian"],
  B:["Yve","Cyclops","Beatrix","Natan","Bane","Fredrinn","Faramis","Natalia","Cecilion","Silvanna","Alice","Brody","Terizla","Khaleed","Clint","Leomord","Akai","Hilda","Aldous","Paquito","Zhuxin","Badang","Ixia","Vale","Aamon","Julian","Moskov","X.Borg","Saber","Xavier","Kaja","Novaria","Suyou","Ruby","Sora","Hanzo","Yi Sun-shin","Lylia","Vexana","Miya","Odette","Cici","Layla","Angela","Claude","Selena","Nolan","Dyrroth","Lesley"],
  C:["Uranus","Joy","Yu Zhong","Hylos","Yin","Kimmy","Roger","Karrie","Thamuz","Lapu-Lapu","Melissa","Aurora","Phoveus","Lunox","Johnson","Wanwan","Hayabusa","Arlott","Freya","Alpha","Gusion","Chang'e","Alucard","Luo Yi","Karina","Jawhead","Harley","Chip","Nana","Pharsa","Martis","Esmeralda","Helcurt"],
  D:["Baxia","Grock","Balmond","Harith","Valentina","Zilong","Kalea","Chou","Gatotkaca","Mathilda","Tigreal","Granger","Lancelot","Fanny","Franco"]
};
const CURRENT_PATCH_TIER_BY_HERO = new Map(
  Object.entries(CURRENT_PATCH_TIER_GROUPS).flatMap(([tier,names]) =>
    names.map(name => [heroImageKey(name),tier])
  )
);
const TIER_DATA_SNAPSHOT = "Патч 2.2.16a · 15 октября 2026 · все ранги";

function tierReason(hero, tier) {
  const custom = tierHighlights[hero.name];
  if (custom) return custom.reason;
  const role = getHeroClasses(hero)[0] || "героя";
  const defaults = {
    S:"Предварительно высокий приоритет. Проверь, подходит ли герой под состав команды и текущий патч.",
    A:"Надёжный вариант во многих ситуациях; результат зависит от противостояния, сборки и мастерства игрока.",
    B:"Средний вариант. Учитывай составы команд, контрпики и собственный опыт игры на герое.",
    D:"По общей статистике герой сейчас уступает большинству вариантов; учитывай контрпики и особенности своего ранга.",
    C:"Выбор требует подходящих условий или хорошего владения героем; учитывай контрпики и план команды."
  };
  return `${defaults[tier]} Роль в каталоге: ${role}.`;
}

function getTierEntries() {
  return heroes.map(hero => {
    const custom = tierHighlights[hero.name] || tierHighlights[hero.name.replace(/[^a-z0-9]/gi,"")];
    const tier = CURRENT_PATCH_TIER_BY_HERO.get(heroImageKey(hero.name)) || "B";
    const role = getHeroClasses(hero);
    const tierReasonText = {
      S:"Текущий срез относит героя к S: один из самых сильных вариантов по общей статистике.",
      A:"Текущий срез относит героя к A: сильный выбор, хотя результат зависит от роли и состава.",
      B:"Текущий срез относит героя к B: средний вариант, эффективность которого зависит от состава команды и ситуации.",
      D:"Текущий срез относит героя к D: по общей статистике он сейчас уступает большинству героев.",
      C:"Текущий срез относит героя к C: ситуативный выбор; особенно важны состав команды и мастерство игрока.",
      D:"Текущий срез относит героя к D: по общей статистике он сейчас уступает большинству героев."
    };
    const reason = [tierReasonText[tier],custom?.reason || ""].filter(Boolean).join(" ");
    return {hero,tier,role,reason};
  }).sort((a,b) => {
    const order = {S:0,A:1,B:2,C:3,D:4};
    return order[a.tier]-order[b.tier] || a.hero.name.localeCompare(b.hero.name);
  });
}

/* Tier-list-only image resolver: prefer the square in-game hero icon for consistent source dimensions.
   This is intentionally separate from heroImageMarkup/heroCircleImageMarkup so the catalog is unchanged. */
function tierHeroImageMarkup(hero) {
  const name = hero.name || "?";
  const initial = heroInitialJS(name);
  const primary = heroImageUrl(name);
  const fallback = hero.image && hero.image !== primary ? hero.image : "";
  return `<img class="hero-image tier-hero-image" src="${escapeHTML(primary)}" alt="${escapeHTML(name)}" loading="lazy" decoding="async" fetchpriority="low" data-tier-fallback="${escapeHTML(fallback)}" onerror="if(this.dataset.tierFallback && this.dataset.tierFallback!==this.src){const next=this.dataset.tierFallback;this.dataset.tierFallback='';this.src=next;}else{this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:'hero-image-fallback',textContent:${initial},role:'img',ariaLabel:'Изображение героя недоступно'}))}">`;
}

function renderTierList() {
  const grid = $("tierGrid");
  const count = $("tierCount");
  if (!grid || !count) return;
  const query = ($("tierSearch")?.value || "").trim().toLocaleLowerCase();
  const filtered = getTierEntries().filter(entry =>
    (activeTier === "Все" || entry.tier === activeTier) &&
    (activeTierRole === "Все" || entry.role.includes(activeTierRole)) &&
    entry.hero.name.toLocaleLowerCase().includes(query)
  );
  count.textContent = `Показано ${filtered.length} из ${heroes.length} героев · сортировка по уровню и имени`;
  if (!filtered.length) {
    const emptyTitle = "Ничего не найдено";
    const emptyMessage = "Измени поиск или сбрось фильтры.";
    grid.innerHTML = `<div class="tier-empty"><strong>${emptyTitle}</strong><p>${emptyMessage}</p><button class="btn btn-ghost" type="button" data-tier-reset>Сбросить фильтры</button></div>`;
    return;
  }
  const tierNames = {S:"Высокий приоритет",A:"Надёжный выбор",B:"Средний уровень",C:"Ситуативный выбор",D:"Ниже среднего"};
  grid.innerHTML = filtered.map(entry => {
    const art = tierHeroImageMarkup(entry.hero);
    const roles = entry.role.map(role => `<span>${escapeHTML(role)}</span>`).join("");
    return `<article class="tier-card">
      <div class="tier-card-art">${art}<span class="tier-rank tier-${entry.tier.toLowerCase()}">${entry.tier}</span></div>
      <div class="tier-card-content">
        <div class="tier-card-meta"><span class="tier-role">${escapeHTML(tierNames[entry.tier])}</span><span class="tier-level-label">${entry.tier} TIER</span></div>
        <h3>${escapeHTML(entry.hero.name)}</h3>
        <div class="tier-role-tags">${roles}</div>
        <details class="tier-details"><summary>Почему этот уровень?</summary><p>${escapeHTML(entry.reason)}</p></details>
      </div>
    </article>`;
  }).join("");
}

function itemFallbackIconMarkup(item) {
  const cat = item.cat;
  const icon = cat === "Attack"
    ? '<path d="M15 3l6 6-3 3-6-6 3-3Z"/><path d="M12 6 4 14l-1 7 7-1 8-8M7 17l-2-2"/>'
    : cat === "Magic"
      ? '<path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/>'
      : cat === "Defense"
        ? '<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><path d="m8 12 2.5 2.5L16 9"/>'
        : cat === "Movement"
          ? '<path d="M4 5h6l2 7 6 2 2 4H4V5Z"/><path d="M8 8h3M9 11h3M11 14h3"/>'
          : cat === "Jungle"
            ? '<path d="M12 3 5 7v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V7l-7-4Z"/><path d="m9 12 2 2 4-5"/>'
            : '<path d="M12 3 21 12 12 21 3 12 12 3Z"/><path d="M8 12h8M12 8v8"/>';
  const label = categories[cat] || cat || "Предмет";
  return `<div class="item-symbol item-symbol-fallback" role="img" aria-label="Иконка: ${escapeHTML(label)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon}</g></svg></div>`;
}

function renderItemCards(filtered, grid, emptyMessage) {
  if (!grid) return;
  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-state">' + escapeHTML(emptyMessage) + '</p>';
    return;
  }
  grid.innerHTML = filtered.map(item=>{
    const saved = favoriteItems.has(item.id);
    const iconSlug = itemIconSlug(item.name);
    // Показываем только изображения из набора оригинальных игровых иконок.
    // Если оригинального файла нет или он недоступен, не подменяем его самодельной пиктограммой.
    const missingIcon = '<div class="item-symbol item-symbol-fallback" role="img" aria-label="Оригинальная иконка недоступна"><span style="font:600 10px/1.4 sans-serif;text-align:center;padding:6px">Нет оригинальной иконки</span></div>';
    // Use real game-icon artwork for jungle spell upgrades and roaming blessings.
    const specialIconSlugs = {
      "retribution":"spell-retribution",
      "ice-retribution":"ice-retribution",
      "flame-retribution":"flame-retribution",
      "bloody-retribution":"bloody-retribution",
      "roam-boots":"boots",
      "roam-conceal":"conceal",
      "roam-encourage":"encourage",
      "roam-favor":"favor",
      "roam-dire-hit":"dire-hit"
    };
    const specialSlug = specialIconSlugs[item.id];
    const iconSource = item.id === "retribution"
      ? new URL("assets/retribution.svg", window.location.href).href
      : specialSlug
        ? "https://mlbbhub.com/images/items/" + specialSlug + ".png"
        : item.imageFile
        ? ITEM_IMAGE_BASE + item.imageFile
        : iconSlug ? ITEM_IMAGE_BASE + iconSlug + ".png" : "";
    const retrySource = item.id === "retribution" ? "" : "";
    const iconMarkup = iconSource
      ? `<img class="item-image" src="${escapeHTML(iconSource)}" data-retry="${escapeHTML(retrySource)}" data-fallback="${escapeHTML(missingIcon)}" alt="${escapeHTML(item.ru)}" loading="lazy" decoding="async" onerror="if(this.dataset.retry && this.dataset.retry!==this.src){const next=this.dataset.retry;this.dataset.retry='';this.src=next;}else{this.onerror=null;this.outerHTML=this.dataset.fallback}">`
      : missingIcon;
    return `<article class="item-card">
      <div class="item-image-wrap">${iconMarkup}</div>
      <div class="item-content">
        <span class="item-category">${escapeHTML(categories[item.cat] || item.cat)}</span>
        <h3>${escapeHTML(item.ru)}</h3>
        <details class="item-original-name"><summary>Оригинальное название</summary><p lang="en">${escapeHTML(item.name)}</p></details>
        <p class="item-stats">${escapeHTML(item.stats)}</p>
        <p class="item-description">${escapeHTML(item.desc)}</p>
        <details><summary>Подробнее</summary><p class="item-tip">${escapeHTML(item.tip)}</p><p class="fine-print">Проверяй актуальные эффекты в текущей версии игры.</p></details>
        ${favoriteButton("item",item.id,saved)}
      </div>
    </article>`;
  }).join("");
}

function itemMatchesPurpose(item) {
  if (itemPurpose === "Все") return true;
  const text = `${item.name} ${item.ru} ${item.stats} ${item.desc} ${item.tip}`.toLocaleLowerCase();
  const rules = {
    "Крит": /крит|critical|berserker|windtalker|критическ/,
    "Скорость атаки": /скорост.{0,8}атак|attack speed|swift boots|corrosion scythe|demon hunter sword|golden staff|windtalker/,
    "Пробивание": /пробиван|penetration|malefic roar|divine glaive|arcane boots|hunter strike/,
    "Антихил": /противодействие лечению|анти.?хил|anti.?heal|восстановлени.{0,12}здоров|sea halberd|dominance ice/,
    "Выживаемость": /выживаем|защит|здоров|щит|health|defen|immortality|athena|radiant armor|antique cuirass/,
    "Лечение и щиты": /лечен|восстановлен|щит|healing|shield|oracle|flask of the oasis|favor|благословение/,
    "Перезарядка": /перезарядк|cooldown|magic shoes|enchanted talisman/
  };
  return (rules[itemPurpose] || /$a/).test(text);
}

function renderItems() {
  const grid = $("itemGrid");
  if (!grid) return;
  let filtered = items.filter(item=>{
    if (item.cat==="Jungle" || item.cat==="Roam") return false;
    const matchesCategory = itemCategory==="Все" || item.cat===itemCategory;
    const haystack = `${item.name} ${item.ru} ${item.desc} ${item.stats} ${item.tip}`.toLocaleLowerCase();
    const matchesQuery = haystack.includes(itemQuery);
    const matchesFavorites = !itemOnlyFavorites || favoriteItems.has(item.id);
    return matchesCategory && matchesQuery && matchesFavorites && itemMatchesPurpose(item);
  });
  if (itemSort === "name") filtered.sort((a,b)=>a.ru.localeCompare(b.ru,"ru"));
  if (itemSort === "favorites") filtered.sort((a,b)=>Number(favoriteItems.has(b.id))-Number(favoriteItems.has(a.id)) || a.ru.localeCompare(b.ru,"ru"));
  const count = $("itemCount");
  if (count) count.textContent = `Предметов в справочнике: ${filtered.length}${itemOnlyFavorites ? " · только избранное" : ""}${itemDataSource === "local" ? " · резервный каталог" : ""}`;
  renderItemCards(filtered,grid,"Ничего не найдено. Измени поиск или фильтры.");
}

function renderPerks() {
  const grid = $("perkGrid");
  if (!grid) return;
  const filtered = items.filter(item=>{
    if (item.cat!=="Jungle" && item.cat!=="Roam") return false;
    const matchesCategory = perkCategory==="Все" || item.cat===perkCategory;
    const haystack = `${item.name} ${item.ru} ${item.desc} ${item.stats} ${item.tip}`.toLocaleLowerCase();
    return matchesCategory && haystack.includes(perkQuery);
  });
  const count = $("perkCount");
  if (count) count.textContent = `Заклинаний и эффектов: ${filtered.length}`;
  renderItemCards(filtered,grid,"В этом разделе ничего не найдено.");
}

const roleBuildTemplates = {
  "Убийца": {role:"Убийца", goal:"Быстрый урон по приоритетной цели", items:["Tough Boots","Blade of the Heptaseas","Malefic Roar","War Axe","Blade of Despair","Rose Gold Meteor"], emblem:"Эмблема убийцы; таланты под темп и урон — отправная точка.", spell:"Возмездие для леса; другой навык — если герой играет не в лесу.", note:"Шаблон по классу, а не индивидуальная мета-сборка для каждого убийцы."},
  "Маг": {role:"Маг", goal:"Магический урон и пробивание", items:["Arcane Boots","Glowing Wand","Lightning Truncheon","Holy Crystal","Divine Glaive","Blood Wings"], emblem:"Эмблема мага; подбирай таланты под урон, перезарядку и стиль героя.", spell:"Вспышка — частый вариант для мобильности, если она подходит герою.", note:"Шаблон по классу. Меняй предметы в зависимости от магической защиты и состава врага."},
  "Стрелок": {role:"Стрелок", goal:"Стабильный урон обычными атаками", items:["Swift Boots","Demon Hunter Sword","Golden Staff","Corrosion Scythe","Malefic Roar","Blade of Despair"], emblem:"Эмблема стрелка; таланты под скорость атаки или критический урон.", spell:"Вдохновение или Вспышка — в зависимости от героя и угроз.", note:"Не каждый стрелок играет через скорость атаки: проверь механику персонажа."},
  "Боец": {role:"Боец", goal:"Баланс урона и выживаемости", items:["Tough Boots","Endless Battle","War Axe","Antique Cuirass","Malefic Roar","Queen's Wings"], emblem:"Эмблема бойца; таланты зависят от роли и стиля боя.", spell:"Возмездие для леса, Вспышка или Исполнение для подходящей линии.", note:"Подбирай защиту под главный источник урона соперника."},
  "Танк": {role:"Танк", goal:"Выживаемость и помощь команде", items:["Tough Boots","Cursed Helmet","Dominance Ice","Athena's Shield","Antique Cuirass","Guardian Helmet"], emblem:"Эмблема танка; защитные таланты — базовая отправная точка.", spell:"Возмездие для леса или Вспышка/Возмездие духа по ситуации и набору навыков.", note:"Не покупай все защитные предметы автоматически: оцени физический и магический урон врагов."},
  "Поддержка": {role:"Поддержка", goal:"Помощь союзникам и выживаемость", items:["Tough Boots","Flask of the Oasis","Dominance Ice","Oracle","Athena's Shield","Guardian Helmet"], emblem:"Эмблема поддержки или подходящая защитная эмблема.", spell:"Исцеление или Вспышка — в зависимости от набора навыков.", note:"Ролевой стартовый вариант; меняй лечение, защиту и сокращение перезарядки под конкретного героя."}
};
const featuredHeroBuilds = {
  "Fanny": {role:"Лес · Убийца", goal:"Мобильность и физический урон", items:["Tough Boots","Blade of the Heptaseas","Malefic Roar","War Axe","Queen's Wings","Rose Gold Meteor"], emblem:"Эмблема убийцы — один из возможных вариантов; сверяй таланты с актуальной версией.", spell:"Возмездие для игры в лесу.", note:"Пример для ориентира. Фанни требовательна к энергии и механике; корректируй сборку под матч."},
  "Claude": {role:"Голд · Стрелок", goal:"Скорость атаки и урон по выносливым целям", items:["Swift Boots","Demon Hunter Sword","Golden Staff","Corrosion Scythe","Malefic Roar","Immortality"], emblem:"Эмблема стрелка с талантами под скорость атаки.", spell:"Вдохновение или Вспышка — выбирай по ситуации.", note:"Порядок покупки зависит от матча; проверяй текущие параметры и доступность предметов."},
  "Belerick": {role:"Роум · Танк", goal:"Защита команды и выживаемость", items:["Tough Boots","Cursed Helmet","Dominance Ice","Oracle","Immortality","Guardian Helmet"], emblem:"Эмблема танка или поддержки с подходящими защитными талантами.", talents:"Упор на стойкость и контроль; выбирай таланты на выживаемость, а последний — под начало боя.", spell:"Возмездие духа или Вспышка — по составу команд и твоей задаче.", note:"Сборка ориентирована на выживаемость; меняй защиту по реальным угрозам соперника."},
  "Miya": {role:"Голд · Стрелок",goal:"Скорость атаки и критический урон",items:["Swift Boots","Berserker's Fury","Windtalker","Haas's Claws","Malefic Roar","Immortality"],emblem:"Эмблема стрелка.",talents:"Таланты на скорость атаки/криты; последний талант — на урон обычных атак.",spell:"Вспышка против угроз или Вдохновение для усиления атак.",note:"Следи за безопасной позицией; меняй предметы под защиту соперника."},
  "Layla": {role:"Голд · Стрелок",goal:"Дальний физический урон",items:["Swift Boots","Berserker's Fury","Haas's Claws","Windtalker","Malefic Roar","Immortality"],emblem:"Эмблема стрелка.",talents:"Урон обычных атак и критические характеристики; последний талант под стиль игры.",spell:"Вспышка — чтобы выйти из опасной ситуации.",note:"У Лейлы нет надёжного рывка: держи дистанцию и играй от команды."},
  "Bruno": {role:"Голд · Стрелок",goal:"Критический урон и усиленные атаки",items:["Swift Boots","Berserker's Fury","Haas's Claws","Malefic Roar","Blade of Despair","Immortality"],emblem:"Эмблема стрелка.",talents:"Критический урон и усиление обычных атак.",spell:"Вспышка или Вдохновение по ситуации.",note:"Не забывай собирать защиту, если противники быстро добираются до стрелка."},
  "Brody": {role:"Голд · Стрелок",goal:"Физический урон и пробивание",items:["Tough Boots","Blade of the Heptaseas","Malefic Roar","Blade of Despair","Sea Halberd","Immortality"],emblem:"Эмблема стрелка или убийцы.",talents:"Таланты на физический урон и пробивание; выживаемость — если часто ловят.",spell:"Вспышка или Исполнение по составу врага.",note:"Подбирай обувь по контролю и урону противника."},
  "Moskov": {role:"Голд · Стрелок",goal:"Скорость атаки и давление обычными атаками",items:["Swift Boots","Demon Hunter Sword","Golden Staff","Corrosion Scythe","Malefic Roar","Immortality"],emblem:"Эмблема стрелка.",talents:"Скорость атаки и усиление обычных атак.",spell:"Вспышка или Вдохновение.",note:"Учитывай позицию и возможность безопасно атаковать."},
  "Karrie": {role:"Голд · Стрелок",goal:"Урон по героям с большим запасом здоровья",items:["Swift Boots","Demon Hunter Sword","Golden Staff","Corrosion Scythe","Malefic Roar","Immortality"],emblem:"Эмблема стрелка.",talents:"Скорость атаки и таланты, усиливающие стабильный урон.",spell:"Вспышка или Вдохновение.",note:"Против тяжёлой передней линии сравнивай предметы по текущему патчу."},
  "Beatrix": {role:"Голд · Стрелок",goal:"Физический урон и пробивание",items:["Tough Boots","Blade of Despair","Malefic Roar","Haas's Claws","Sea Halberd","Immortality"],emblem:"Эмблема стрелка.",talents:"Физический урон; подбирай таланты под выбранное оружие и стиль.",spell:"Вспышка — универсальный защитный вариант.",note:"Сборка зависит от оружия и текущей игровой версии."},
  "Vexana": {role:"Мид · Маг", goal:"Магический урон и пробивание", items:["Arcane Boots","Glowing Wand","Lightning Truncheon","Holy Crystal","Divine Glaive","Immortality"], emblem:"Эмблема мага с талантами под урон и выбранный стиль.", talents:"Магический урон/пробивание; последний талант — под взрывной урон или частое применение навыков.", spell:"Вспышка — для дополнительной мобильности.", note:"Пример на основе доступных сборочных ориентиров; меняй защитный слот под угрозы."},
  "Nana": {role:"Мид · Маг",goal:"Магический урон и контроль",items:["Arcane Boots","Genius Wand","Glowing Wand","Holy Crystal","Divine Glaive","Immortality"],emblem:"Эмблема мага.",talents:"Магический урон и пробивание; последний талант под урон навыков.",spell:"Вспышка для безопасной позиции.",note:"Защитный слот меняй под главную угрозу."},
  "Eudora": {role:"Мид · Маг",goal:"Взрывной магический урон",items:["Arcane Boots","Genius Wand","Holy Crystal","Divine Glaive","Lightning Truncheon","Immortality"],emblem:"Эмблема мага.",talents:"Таланты на магическую мощь и взрывной урон.",spell:"Вспышка для выхода из опасности или поиска позиции.",note:"Не трать комбинацию на танка, если рядом есть приоритетная цель."},
  "Aurora": {role:"Мид · Маг",goal:"Магический урон и контроль",items:["Arcane Boots","Glowing Wand","Holy Crystal","Divine Glaive","Lightning Truncheon","Immortality"],emblem:"Эмблема мага.",talents:"Магический урон; подбирай последний талант под частоту навыков.",spell:"Вспышка.",note:"Сохраняй контроль для начала боя или защиты союзников."},
  "Odette": {role:"Мид · Маг",goal:"Урон по области",items:["Arcane Boots","Lightning Truncheon","Holy Crystal","Divine Glaive","Blood Wings","Immortality"],emblem:"Эмблема мага.",talents:"Магическая мощь и урон навыков.",spell:"Вспышка — для позиции перед ультимейтом.",note:"Следи за навыками контроля соперников перед использованием ультимейта."},
  "Cecilion": {role:"Мид · Маг",goal:"Масштабирование и магический урон",items:["Demon Boots","Clock of Destiny","Lightning Truncheon","Holy Crystal","Divine Glaive","Immortality"],emblem:"Эмблема мага.",talents:"Магическая мощь и мана/перезарядка, если доступны в актуальной версии.",spell:"Вспышка.",note:"Стабильно фарми и не затягивай рискованные размены в начале."},
  "Lylia": {role:"Мид · Маг",goal:"Частые навыки и магический урон",items:["Magic Boots","Glowing Wand","Genius Wand","Holy Crystal","Divine Glaive","Immortality"],emblem:"Эмблема мага.",talents:"Сокращение перезарядки и магический урон.",spell:"Вспышка.",note:"Сохраняй ультимейт для безопасного выхода из опасной ситуации."},
  "Kagura": {role:"Мид · Маг",goal:"Комбинации и магическое пробивание",items:["Arcane Boots","Genius Wand","Holy Crystal","Divine Glaive","Lightning Truncheon","Immortality"],emblem:"Эмблема мага.",talents:"Магический урон и пробивание.",spell:"Вспышка.",note:"Тренируй комбинации и держи навык отхода."},
  "Terizla": {role:"EXP · Боец",goal:"Выживаемость и урон по области",items:["Tough Boots","War Axe","Queen's Wings","Antique Cuirass","Dominance Ice","Immortality"],emblem:"Эмблема бойца.",talents:"Устойчивость и урон в затяжном бою.",spell:"Вспышка или Исполнение по ситуации.",note:"Подбирай защиту под тип урона соперника на линии."},
  "Ruby": {role:"EXP · Боец",goal:"Контроль, восстановление и выживаемость",items:["Tough Boots","War Axe","Queen's Wings","Oracle","Dominance Ice","Immortality"],emblem:"Эмблема бойца или танка.",talents:"Устойчивость и таланты, помогающие в продолжительном бою.",spell:"Вспышка для комбинаций и выхода из опасности.",note:"Меняй защиту под состав врагов и свою роль в командных боях."},
  "Dyrroth": {role:"EXP · Боец",goal:"Физический урон и пробивание",items:["Tough Boots","War Axe","Hunter Strike","Malefic Roar","Blade of Despair","Immortality"],emblem:"Эмблема бойца или убийцы.",talents:"Физический урон и пробивание.",spell:"Исполнение или Вспышка.",note:"Используй снижение защиты цели и не заходи в бой без пути отхода."},
  "Yu Zhong": {role:"EXP · Боец",goal:"Вход в бой и устойчивость",items:["Tough Boots","War Axe","Queen's Wings","Oracle","Antique Cuirass","Immortality"],emblem:"Эмблема бойца.",talents:"Устойчивость и усиление затяжного боя.",spell:"Вспышка.",note:"Ищи момент зайти на заднюю линию, когда опасный контроль потрачен."},
  "Alpha": {role:"Лес / EXP · Боец",goal:"Урон навыков и устойчивость",items:["Tough Boots","War Axe","Hunter Strike","Queen's Wings","Antique Cuirass","Immortality"],emblem:"Эмблема бойца.",talents:"Урон навыков и устойчивость.",spell:"Возмездие в лесу; Вспышка на линии.",note:"Выбирай предметы по составу врага и своей роли."},
  "Balmond": {role:"Лес · Боец",goal:"Урон и устойчивость в лесу",items:["Tough Boots","War Axe","Hunter Strike","Queen's Wings","Antique Cuirass","Immortality"],emblem:"Эмблема бойца.",talents:"Физический урон и выживаемость.",spell:"Возмездие в лесу.",note:"Подстраивай защиту под основной урон врагов."},
  "Fredrinn": {role:"Лес · Танк",goal:"Передняя линия и контроль целей",items:["Tough Boots","Cursed Helmet","Dominance Ice","Antique Cuirass","Athena's Shield","Immortality"],emblem:"Эмблема танка.",talents:"Защитные таланты и устойчивость в продолжительном бою.",spell:"Возмездие.",note:"Собирайся по фактическому урону соперников."},
  "Tigreal": {role:"Роум · Танк",goal:"Начало боя и контроль",items:["Tough Boots","Dominance Ice","Athena's Shield","Antique Cuirass","Immortality","Guardian Helmet"],emblem:"Эмблема танка.",talents:"Защита и устойчивость; талант на контроль/командную пользу, если доступен.",spell:"Вспышка для комбинации или Возмездие духа.",note:"Согласовывай начало боя с командой."},
  "Khufra": {role:"Роум · Танк",goal:"Контроль мобильных врагов",items:["Tough Boots","Dominance Ice","Antique Cuirass","Athena's Shield","Immortality","Guardian Helmet"],emblem:"Эмблема танка.",talents:"Устойчивость и защитные таланты.",spell:"Вспышка или Возмездие духа.",note:"Особенно цени контроль против героев с рывками."},
  "Atlas": {role:"Роум · Танк",goal:"Командный контроль и начало боя",items:["Tough Boots","Dominance Ice","Athena's Shield","Antique Cuirass","Immortality","Guardian Helmet"],emblem:"Эмблема танка.",talents:"Защита и устойчивость.",spell:"Вспышка для неожиданного начала боя.",note:"Начинай бой, когда союзники готовы продолжить атаку."},
  "Franco": {role:"Роум · Танк",goal:"Пики и точечный контроль",items:["Tough Boots","Dominance Ice","Athena's Shield","Antique Cuirass","Immortality","Guardian Helmet"],emblem:"Эмблема танка.",talents:"Выживаемость и усиление контроля/командной пользы.",spell:"Вспышка или Возмездие духа.",note:"Выбирай цели, которых команда сможет быстро устранить."},
  "Lolita": {role:"Роум · Танк",goal:"Защита союзников и контроль",items:["Tough Boots","Dominance Ice","Athena's Shield","Antique Cuirass","Immortality","Guardian Helmet"],emblem:"Эмблема танка.",talents:"Защитные таланты и устойчивость.",spell:"Возмездие духа или Вспышка.",note:"Оцени, какие атаки и снаряды можно блокировать."},
  "Angela": {role:"Роум · Поддержка",goal:"Щиты, помощь союзнику и выживаемость",items:["Tough Boots","Oracle","Dominance Ice","Athena's Shield","Immortality","Flask of the Oasis"],emblem:"Эмблема поддержки.",talents:"Командная польза, восстановление и сокращение перезарядки.",spell:"Исцеление или Вспышка.",note:"Выбирай союзника для ультимейта по ситуации, а не автоматически."},
  "Estes": {role:"Роум · Поддержка",goal:"Лечение и защита команды",items:["Tough Boots","Oracle","Dominance Ice","Athena's Shield","Immortality","Flask of the Oasis"],emblem:"Эмблема поддержки.",talents:"Восстановление и командная польза.",spell:"Исцеление или Вспышка.",note:"Держись рядом с командой и учитывай антихил соперников."},
  "Diggie": {role:"Роум · Поддержка",goal:"Снятие контроля и командная поддержка",items:["Tough Boots","Flask of the Oasis","Dominance Ice","Athena's Shield","Immortality","Winter Crown"],emblem:"Эмблема поддержки.",talents:"Сокращение перезарядки и командная польза.",spell:"Исцеление или Вспышка.",note:"Сохраняй ультимейт под важный массовый контроль врага."},
  "Clint": {role:"Голд · Стрелок",goal:"Критический урон, пробивание и безопасная дальность",items:["Magic Boots","Endless Battle","Berserker's Fury","Haas's Claws","Malefic Roar","Blade of Despair"],emblem:"Эмблема стрелка с упором на физический урон и критические атаки.",talents:"Урон обычных атак и усиление критического стиля; адаптируй последний талант к матчу.",spell:"Вспышка для безопасности; Вдохновение — если нужен дополнительный темп урона.",note:"Ориентир для агрессивного Клинта на Gold Lane. Если важнее ранний взрывной урон, проверь Клинок гептасисов; против физического урона рассматривай Ветер природы."},
  "Sun": {role:"Лес / EXP · Боец",goal:"Давление клонами и урон по выносливым целям",items:["Swift Boots","Corrosion Scythe","Demon Hunter Sword","Golden Staff","Sea Halberd","Windtalker"],emblem:"Эмблема бойца с упором на устойчивый урон.",talents:"Усиление обычных атак и продолжительного боя.",spell:"Возмездие в лесу; Вспышка или Исполнение на линии.",note:"Для леса ориентируйся на скорость фарма и урон клонами; меняй защитный слот по составу врагов."},
  "Kadita": {role:"Мид · Маг",goal:"Взрывной магический урон и пробивание",items:["Arcane Boots","Sky Piercer","Genius Wand","Lightning Truncheon","Holy Crystal","Divine Glaive"],emblem:"Эмблема мага с упором на магический урон и пробивание.",talents:"Магический взрывной урон; защитный талант выбирай под контроль соперника.",spell:"Вспышка для комбинаций и безопасного выхода.",note:"Ищи момент для комбинации по уязвимой цели; Корона зимы может быть ситуативной заменой урона ради выживания."}
};
let activeBuildHeroName = "";
let activeBuildRoles = [];
let activeBuildVariant = "standard";
let activeBuildTalentStyle = "Командные бои";

const magicDamageHeroNames = new Set([
  "Aamon","Alice","Aurora","Cecilion","Chang'e","Cyclops","Esmeralda","Eudora",
  "Faramis","Gord","Guinevere","Gusion","Harith","Harley","Kadita","Kagura","Lylia",
  "Luo Yi","Lunox","Nana","Novaria","Odette","Pharsa","Selena","Valentina",
  "Vale","Valir","Vexana","Xavier","Yve","Zhask","Julian","Silvanna"
]);
const roleAliases = {
  "assassin":"Убийца","убийца":"Убийца",
  "mage":"Маг","маг":"Маг",
  "marksman":"Стрелок","стрелок":"Стрелок",
  "fighter":"Боец","боец":"Боец",
  "tank":"Танк","танк":"Танк",
  "support":"Поддержка","поддержка":"Поддержка"
};
function resolveBuildRole(roles) {
  const classes = Array.isArray(roles) ? roles : [String(roles || "")];
  for (const value of classes) {
    const normalized = String(value).trim().toLowerCase();
    const role = roleAliases[normalized] || value;
    if (roleBuildTemplates[role]) return role;
  }
  return "Боец";
}
// Персональные рекомендации боевого заклинания. Это стартовый выбор; перед матчем
// его можно менять под линию, мобильность героя и контроль соперника.
const HERO_BATTLE_SPELL_OVERRIDES = {
  "Fanny":"Возмездие — обязательный выбор для леса.",
  "Gusion":"Возмездие — основной выбор для леса.",
  "Ling":"Возмездие — обязательный выбор для леса.",
  "Saber":"Возмездие — основной выбор для леса.",
  "Lancelot":"Возмездие — основной выбор для леса.",
  "Hayabusa":"Возмездие — основной выбор для леса.",
  "Aamon":"Возмездие — основной выбор для леса.",
  "Balmond":"Возмездие — если выбран лес.",
  "Fredrinn":"Возмездие — обязательный выбор для леса.",
  "Claude":"Вдохновение — усиливает частые обычные атаки.",
  "Belerick":"Возмездие духа — хорошо сочетается с ролью передней линии.",
  "Miya":"Вспышка — помогает сохранить безопасную позицию.",
  "Layla":"Вспышка — помогает выйти из опасности.",
  "Bruno":"Вспышка — безопасный универсальный выбор.",
  "Brody":"Вспышка — помогает сохранить дистанцию.",
  "Moskov":"Вспышка — для выхода из опасной позиции.",
  "Karrie":"Вспышка — безопасный выбор для стрелка.",
  "Beatrix":"Вспышка — помогает сменить позицию.",
  "Clint":"Вспышка — основной выбор для агрессивной игры с возможностью отступить.",
  "Vexana":"Вспышка — помогает держать дистанцию и менять позицию.",
  "Nana":"Вспышка — дополнительный способ избежать атаки.",
  "Eudora":"Вспышка — помогает занять позицию для комбинации или отступить.",
  "Aurora":"Вспышка — для безопасной позиции и выхода из опасности.",
  "Odette":"Вспышка — помогает занять позицию для ультимейта.",
  "Cecilion":"Вспышка — сохраняет дистанцию для нанесения урона.",
  "Lylia":"Вспышка — дополнительный способ сменить позицию.",
  "Kagura":"Вспышка — помогает реализовать комбинацию и отойти.",
  "Terizla":"Вспышка — помогает начать бой или отступить.",
  "Ruby":"Вспышка — помогает сблизиться и продолжить контроль.",
  "Dyrroth":"Исполнение — для добивания ослабленных целей на линии.",
  "Yu Zhong":"Вспышка — помогает добраться до задней линии.",
  "Tigreal":"Вспышка — помогает начать бой неожиданно.",
  "Khufra":"Вспышка — помогает начать бой и выбрать позицию.",
  "Atlas":"Вспышка — помогает неожиданно начать командный бой.",
  "Franco":"Вспышка — помогает занять позицию для захвата цели.",
  "Lolita":"Вспышка — помогает занять позицию для контроля и защиты.",
  "Angela":"Исцеление — усиливает роль поддержки команды.",
  "Estes":"Исцеление — усиливает лечение союзников.",
  "Floryn":"Исцеление — усиливает роль командного лекаря.",
  "Rafaela":"Исцеление — поддерживает лечение и командные бои.",
  "Diggie":"Вспышка — помогает занять безопасную позицию для поддержки.",
  "Kadita":"Вспышка — помогает реализовать комбинацию и безопасно выйти.",
  "Sun":"Возмездие для леса; Вспышка на EXP-линии.",
  "Alpha":"Возмездие для леса; Вспышка на EXP-линии.",
  "Julian":"Возмездие для леса; Вспышка на линии.",
  "Harley":"Возмездие — основной выбор для леса.",
  "Karina":"Возмездие — основной выбор для леса.",
  "Helcurt":"Возмездие — основной выбор для леса.",
  "Nolan":"Возмездие — основной выбор для леса.",
  "Suyou":"Возмездие — обязательный выбор для леса.",
  "Aulus":"Возмездие — обязательный выбор для леса.",
  "Roger":"Возмездие — если выбран лес; на линии подбирай навык под матч.",
  "Granger":"Вспышка — безопасный выбор для стрелка.",
  "Ixia":"Вспышка — помогает сохранить позицию во время атаки.",
  "Melissa":"Вспышка — помогает пережить сближение противника.",
  "Wanwan":"Вспышка — запасной инструмент для смены позиции.",
  "Hanabi":"Вспышка — помогает сохранить дистанцию.",
  "Natan":"Вспышка — помогает занять позицию для урона.",
  "Lesley":"Вспышка — помогает выйти из опасной ситуации.",
  "Pharsa":"Вспышка — помогает занять безопасную позицию для ультимейта.",
  "Xavier":"Вспышка — помогает сохранить дистанцию.",
  "Valir":"Вспышка — дополнительная защита от сближения.",
  "Valentina":"Вспышка — помогает занять позицию и отступить.",
  "Carmilla":"Вспышка — помогает начать бой вместе с командой.",
  "Minotaur":"Вспышка — помогает выбрать момент для массового контроля.",
  "Johnson":"Вспышка — универсальный вариант для смены позиции.",
  "Hylos":"Вспышка — помогает начать бой или отступить.",
  "Grock":"Вспышка — помогает занять позицию для начала боя."
};

function getBattleSpellRecommendation(heroName, roles, featured) {
  const name = String(heroName || "").trim();
  if (HERO_BATTLE_SPELL_OVERRIDES[name]) return HERO_BATTLE_SPELL_OVERRIDES[name];

  const catalogHero = heroes.find(hero =>
    String(hero.name || "").toLocaleLowerCase() === name.toLocaleLowerCase()
  );
  const laneText = String(featured?.role || catalogHero?.lane || "").toLocaleLowerCase();
  if (/лес|jungle/.test(laneText)) return "Возмездие — основной выбор для леса.";
  if (/голд|gold/.test(laneText)) return "Вспышка — безопасный стартовый выбор для стрелка.";
  if (/мид|mid/.test(laneText)) return "Вспышка — универсальный стартовый выбор для мидера.";
  if (/роум|roam/.test(laneText)) {
    return resolveBuildRole(roles) === "Поддержка"
      ? "Исцеление — стартовый выбор для поддержки с лечением."
      : "Вспышка — стартовый выбор для роумера.";
  }
  if (/exp/.test(laneText)) return "Вспышка — универсальный стартовый выбор для EXP-линии.";

  const role = resolveBuildRole(roles);
  if (role === "Убийца") return "Возмездие — если герой выбран в лес; на линии выбор зависит от матча.";
  if (role === "Поддержка") return "Исцеление — стартовый выбор для командной поддержки.";
  return "Вспышка — универсальный стартовый выбор; меняй его под состав соперника.";
}

function getHeroBuild(heroName, roles) {
  const name = String(heroName || "").trim();
  const featured = featuredHeroBuilds[name];
  const role = resolveBuildRole(roles);
  const roleValues = Array.isArray(roles) ? roles : String(roles || "").split(",");
  const normalizedRoles = roleValues.map(value => {
    const normalized = String(value).trim().toLowerCase();
    return roleAliases[normalized] || roleTranslations[normalized] || String(value).trim();
  });
  // У части героев несколько классов: проверяем все роли, а не только первую.
  const hasMagicRole = normalizedRoles.some(value =>
    /(^|[ ·/])маг($|[ ·/])/i.test(String(value)) ||
    /(^|[ ·/])mage($|[ ·/])/i.test(String(value))
  );
  const roleText = String(featured?.role || "");
  const isMagicBuild = magicDamageHeroNames.has(name) ||
    hasMagicRole ||
    role === "Маг" ||
    /(^|[ ·/])маг($|[ ·/])/i.test(roleText) ||
    /(^|[ ·/])mage($|[ ·/])/i.test(roleText);
  const magicTemplate = roleBuildTemplates["Маг"];
  if (featured) {
    const build = {...featured, personalized:true, isMagicBuild, spell:getBattleSpellRecommendation(name, roles, featured)};
    const hasPhysicalAttackItem = build.items.some(itemName => {
      const item = items.find(entry => entry.name === itemName);
      return item?.cat === "Attack";
    });
    if (isMagicBuild && hasPhysicalAttackItem) {
      build.items = [...magicTemplate.items];
      build.goal = "Магический урон и пробивание";
      build.note = "Базовая магическая сборка для ориентира. Подстраивай защитный слот и порядок покупки под соперников.";
    }
    return build;
  }
  const template = isMagicBuild ? magicTemplate : roleBuildTemplates[role];
  return {...template, personalized:false, isMagicBuild, spell:getBattleSpellRecommendation(name, roles, null)};
}
function getVariantItems(build, variant) {
  const roleText = String(build.role || "");
  const isMagicBuild = Boolean(build.isMagicBuild) ||
    /(^|[ ·/])маг($|[ ·/])/i.test(roleText);
  if (variant === "standard") return build.items;
  if (variant === "antiTank") {
    if (isMagicBuild) return ["Arcane Boots","Glowing Wand","Divine Glaive","Holy Crystal","Lightning Truncheon","Immortality"];
    if (/Стрелок/i.test(roleText)) return ["Swift Boots","Demon Hunter Sword","Corrosion Scythe","Malefic Roar","Rose Gold Meteor","Immortality"];
    if (/Танк|Поддержка/i.test(roleText)) return ["Tough Boots","Dominance Ice","Antique Cuirass","Cursed Helmet","Athena's Shield","Immortality"];
    return ["Tough Boots","Blade of the Heptaseas","Malefic Roar","War Axe","Blade of Despair","Immortality"];
  }
  if (/Танк|Поддержка/i.test(roleText)) return ["Tough Boots","Cursed Helmet","Dominance Ice","Athena's Shield","Antique Cuirass","Guardian Helmet"];
  if (isMagicBuild) return ["Tough Boots","Athena's Shield","Rose Gold Meteor","Immortality","Oracle","Divine Glaive"];
  return ["Tough Boots","Athena's Shield","Antique Cuirass","Rose Gold Meteor","Immortality","Oracle"];
}
function renderHeroBuildModal() {
  const modal = $("buildModal");
  const content = $("buildModalContent");
  if (!modal || !content || !activeBuildHeroName) return;
  const build = getHeroBuild(activeBuildHeroName, activeBuildRoles);
  const selectedItems = build.items;
  const itemRows = selectedItems.map((name,index)=>{
    const item = items.find(entry=>entry.name===name);
    const iconSlug = item ? itemIconSlug(item.name) : null;
    const iconUrl = item && item.imageFile ? ITEM_IMAGE_BASE + item.imageFile : iconSlug ? ITEM_IMAGE_BASE + iconSlug + ".png" : "";
    const icon = iconUrl
      ? `<img class="build-item-icon" src="${escapeHTML(iconUrl)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'build-item-icon-fallback',textContent:'⚔'}))">`
      : `<span class="build-item-icon-fallback">⚔</span>`;
    return `<div class="build-item-row"><span class="build-slot">0${index+1}</span>${icon}<div><strong>${escapeHTML(item?item.ru:name)}</strong><span>${escapeHTML(item?item.stats:"Проверь предмет в клиенте игры.")}</span></div></div>`;
  }).join("");
  const talentPreset = getHeroTalentPreset(activeBuildHeroName, activeBuildRoles, activeBuildTalentStyle);
  const talentText = build.talents || "Выбери таланты под механику героя и текущую ситуацию.";
  const talentStyles = ["Агрессивно","Командные бои","Выживаемость"];
  const modalTalentRows = talentPreset.talents.map((talent,index)=>`<article class="build-talent-row"><button type="button" class="build-talent-toggle" aria-expanded="false" aria-controls="build-talent-description-${index}"><span class="build-talent-index">${["I","II","III"][index] || index+1}</span><span class="build-talent-glyph" aria-hidden="true">${talentIconMarkupForBuild(talent[1],index)}</span><span class="build-talent-heading"><strong>${escapeHTML(talent[1])}</strong><span class="build-talent-expand" aria-hidden="true">+</span></span></button><p class="build-talent-description" id="build-talent-description-${index}" hidden>${escapeHTML(talent[2])}</p></article>`).join("");
  content.innerHTML = `<h2 id="buildModalTitle">${escapeHTML(activeBuildHeroName)} <span class="red">/ СБОРКА</span></h2>
    <p class="build-modal-subtitle">${escapeHTML(build.role)} · ${build.isMagicBuild ? "МАГИЧЕСКАЯ СБОРКА" : "СБОРКА ПО РОЛИ"} · ${escapeHTML(build.goal)}</p>
    <div class="build-modal-section"><h3>Одна рекомендуемая сборка · предметы по порядку</h3><p class="fine-print">Порядок покупки — ориентир, а не обязательная последовательность для каждого матча.</p><div class="build-item-list">${itemRows}</div></div>
    <div class="build-advice">
      <div class="build-advice-card"><span class="build-advice-icon">✦</span><div><strong>Эмблема</strong><p>${escapeHTML(build.emblem || talentPreset.emblem)}</p></div></div>
      <div class="build-advice-card build-advice-talents"><span class="build-advice-icon">◆</span><div><strong>Таланты / перки</strong><label class="build-style-label" for="buildTalentStyle">Стиль комбинации</label><select id="buildTalentStyle" class="build-style-select">${talentStyles.map(style=>`<option value="${escapeHTML(style)}" ${activeBuildTalentStyle===style?"selected":""}>${escapeHTML(style)}</option>`).join("")}</select><div class="build-talent-list">${modalTalentRows || `<p>${escapeHTML(talentText)}</p>`}</div></div></div>
      <div class="build-advice-card build-advice-spell"><span class="build-advice-icon">➤</span><div><strong>Боевой навык</strong>${battleSpellMarkup(build.spell)}</div></div>
    </div>
    <p class="build-modal-note">${build.personalized ? "Рекомендация для конкретного героя. " : "Пока это шаблон по классу, а не точная сборка для каждого героя. "}${escapeHTML(build.note)}</p>
    <p class="fine-print">Сборки и таланты могут меняться после патчей. Перед ранговой игрой проверь обновления и подстраивай защитный слот под врагов.</p>`;
}
function openHeroBuild(heroName, rolesText) {
  const modal = $("buildModal");
  if (!modal) return;
  activeBuildHeroName = String(heroName || "");
  activeBuildRoles = String(rolesText || "").split(",").map(value=>value.trim()).filter(Boolean);
  activeBuildVariant = "standard";
  activeBuildTalentStyle = "Командные бои";
  renderHeroBuildModal();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  const closeButton = modal.querySelector(".build-modal-close");
  if (closeButton) closeButton.focus();
}
function closeHeroBuild() {
  const modal = $("buildModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function renderBuildHeroAvatars() {
  const container = $("buildHeroAvatars");
  if (!container) return;
  const sortedHeroes = [...heroes].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "en", { sensitivity: "base" }));
  const rosterSignature = sortedHeroes.map(hero => String(hero.name || "")).join("|");
  // Rebuild when the remote catalog replaces the initial offline fallback list.
  if (container.dataset.rosterSignature !== rosterSignature) {
    container.innerHTML = sortedHeroes.map(hero => `
      <button type="button" class="build-hero-avatar" data-build-hero="${escapeHTML(hero.name)}" aria-pressed="false" aria-label="Выбрать ${escapeHTML(hero.name)}">
        <span class="build-hero-avatar-art">${heroCircleImageMarkup(hero)}</span>
        <span class="build-hero-avatar-name">${escapeHTML(hero.name)}</span>
      </button>`).join("");
    container.dataset.rendered = "true";
    container.dataset.rosterSignature = rosterSignature;
  }
  const selectedName = buildQuery.trim().toLocaleLowerCase();
  const query = buildHeroPickerQuery.trim().toLocaleLowerCase();
  let visible = 0;
  container.querySelectorAll("[data-build-hero]").forEach(button => {
    const name = String(button.dataset.buildHero || "");
    const matches = name.toLocaleLowerCase().includes(query);
    button.hidden = !matches;
    if (matches) visible++;
    button.setAttribute("aria-pressed", String(name.toLocaleLowerCase() === selectedName));
  });
  const count = $("buildHeroPickerCount");
  if (count) {
    count.textContent = query
      ? (visible ? `Найдено героев: ${visible} из ${heroes.length}` : "Ничего не найдено — попробуй другое имя.")
      : `Все герои: ${heroes.length}. Список отсортирован по алфавиту.`;
  }
}
function renderBuilds() {
  const grid = $("buildGrid");
  if (!grid) return;

  renderBuildHeroAvatars();
  const query = buildQuery.trim().toLocaleLowerCase();
  const filtered = heroes.filter(hero => {
    const roles = getHeroClasses(hero);
    const matchesRole = buildRoleFilter === "Все" || roles.includes(buildRoleFilter);
    const matchesQuery = String(hero.name || "").toLocaleLowerCase().includes(query);
    return matchesRole && matchesQuery;
  });

  const count = $("buildCount");
  if (count) count.textContent = `Героев в списке сборок: ${filtered.length} из ${heroes.length}`;

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-state">Герои не найдены. Измени поиск или выбери другую роль.</p>';
    return;
  }

  grid.innerHTML = filtered.map(hero => {
    const roles = getHeroClasses(hero);
    const build = getHeroBuild(hero.name, roles);
    const rows = build.items.map((name,index) => {
      const item = items.find(entry => entry.name === name);
      const iconSlug = item ? itemIconSlug(item.name) : null;
      const iconUrl = item && item.imageFile ? ITEM_IMAGE_BASE + item.imageFile : iconSlug ? ITEM_IMAGE_BASE + iconSlug + ".png" : "";
      const icon = iconUrl
        ? `<img class="build-item-icon" src="${escapeHTML(iconUrl)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'build-item-icon-fallback',textContent:'⚔'}))">`
        : `<span class="build-item-icon-fallback">⚔</span>`;
      return `<div class="build-item-row"><span class="build-slot">0${index+1}</span>${icon}<div><strong>${escapeHTML(item ? item.ru : name)}</strong><span>${escapeHTML(item ? item.stats : "Проверь предмет в актуальной версии игры.")}</span></div></div>`;
    }).join("");

    return `<article class="build-card" data-build-card="${escapeHTML(hero.name)}">
      <span class="build-label">BUILD LAB / ${escapeHTML(hero.name)}</span>
      <h3>${escapeHTML(hero.name)}</h3>
      <p>${escapeHTML(roles.join(" / "))}</p>
      <p><strong>Направление:</strong> ${escapeHTML(build.goal)}</p>
      <div class="build-item-list">${rows}</div>
      <p class="fine-print">${build.personalized ? "Подборка для конкретного героя." : "Стартовый шаблон по роли; не индивидуальная мета-сборка."} ${escapeHTML(build.note)}</p>
      <button class="btn btn-ghost build-open-button" type="button" data-open-build="${escapeHTML(hero.name)}" data-build-roles="${escapeHTML(roles.join(","))}">Все варианты сборки ↗</button>
    </article>`;
  }).join("");
}

function renderFavorites() {
  const grid = $("favoritesGrid");
  if (!grid) return;

  const heroesTab = $("favHeroesTab");
  const itemsTab = $("favItemsTab");
  heroesTab.classList.toggle("active",favoriteTab==="heroes");
  itemsTab.classList.toggle("active",favoriteTab==="items");
  heroesTab.setAttribute("aria-pressed",String(favoriteTab==="heroes"));
  itemsTab.setAttribute("aria-pressed",String(favoriteTab==="items"));

  if (favoriteTab==="heroes") {
    const saved = heroes.filter(h=>favoriteHeroes.has(String(h.id)));
    grid.innerHTML = saved.length ? saved.map(hero=>`
      <article class="hero-card">
        <div class="hero-image-wrap">${heroCircleImageMarkup(hero)}</div>
        <div class="hero-card-content"><h3>${escapeHTML(hero.name)}</h3>
        <p class="hero-role">${escapeHTML(getHeroClasses(hero).join(" / "))}</p>
        <a class="btn btn-3d hero-card-3d" href="${escapeHTML(hero3DModelUrl(hero))}" target="_blank" rel="noopener noreferrer" aria-label="Открыть 3D-модель героя ${escapeHTML(hero.name)}">◈ 3D-модель героя ↗</a>
        ${favoriteButton("hero",String(hero.id),true)}</div>
      </article>`).join("") :
      '<p class="empty-state">Ты пока не добавил героев. Нажми ☆ в карточке героя.</p>';
  } else {
    const saved = items.filter(i=>favoriteItems.has(i.id));
    grid.innerHTML = saved.length ? saved.map(item=>`
      <article class="item-card"><div class="item-content">
        <span class="item-category">${escapeHTML(categories[item.cat])}</span>
        <h3>${escapeHTML(item.ru)}</h3><p>${escapeHTML(item.name)}</p>
        <p class="item-description">${escapeHTML(item.desc)}</p>
        ${favoriteButton("item",item.id,true)}
      </div></article>`).join("") :
      '<p class="empty-state">Ты пока не добавил предметы. Нажми ☆ в карточке предмета.</p>';
  }
}

function updateFavorite(type,id) {
  const set = type==="hero" ? favoriteHeroes : favoriteItems;
  const storageKey = type==="hero" ? "grimgg-favorite-heroes" : "grimgg-favorite-items";

  if (set.has(id)) {
    set.delete(id);
    showToast("Удалено из избранного");
  } else {
    set.add(id);
    showToast("Добавлено в избранное");
  }

  safeWrite(storageKey,set);
  renderHeroes();
  renderTierList();
  renderItems();
  renderFavorites();
  if (type === "hero" && activeDetailHeroId) {
    const activeHero = getHeroById(activeDetailHeroId);
    if (activeHero) {
      renderHeroDetailContent(activeHero,$("heroDetailModalContent"));
      renderHeroDetailContent(activeHero,$("heroDetailPage"));
    }
  }
}

let activeComboRole = "Все";
function renderComboGuides() {
  const grid = $("comboGrid");
  if (!grid) return;
  const query = ($("comboSearch")?.value || "").trim().toLocaleLowerCase();
  const filtered = comboGuides.filter(combo => {
    const roleMatch = activeComboRole === "Все" || combo.role === activeComboRole;
    const haystack = [combo.hero,combo.key,combo.role,combo.situation,combo.difficulty,combo.tip,combo.search,...combo.steps].join(" ").toLocaleLowerCase();
    return roleMatch && (!query || haystack.includes(query));
  });
  const count = $("comboCount");
  if (count) count.textContent = `Показано комбо: ${filtered.length} из ${comboGuides.length}`;
  if (!filtered.length) {
    grid.innerHTML = '<div class="combo-empty"><strong>Ничего не найдено</strong><p>Попробуй другое имя героя или сбрось фильтр роли.</p><button class="filter" type="button" data-combo-reset>Сбросить фильтры</button></div>';
    return;
  }
  grid.innerHTML = filtered.map((combo,index) => `
    <article class="combo-card">
      <div class="combo-card-top">
        <span class="combo-code">COMBO_${String(index+1).padStart(2,"0")}</span>
        <div class="combo-card-meta">
          <span class="combo-difficulty difficulty-${combo.difficulty==="Высокая"?"hard":combo.difficulty==="Средняя"?"medium":"easy"}">Сложность: ${escapeHTML(combo.difficulty.toLocaleLowerCase())}</span>
          <span class="combo-battle-spell"><strong>Боевой навык:</strong> ${escapeHTML(combo.battleSpell?.name || "Вспышка (Flicker)")}</span>
        </div>
      </div>
      <div class="combo-card-heading"><div class="combo-avatar">${(() => { const matchedHero = heroes.find(hero => hero.name.toLocaleLowerCase() === combo.key.toLocaleLowerCase()); return matchedHero ? heroImageMarkup(matchedHero) : `<span aria-hidden="true">${escapeHTML(combo.hero.slice(0,1).toUpperCase())}</span>`; })()}</div><div><h3>${escapeHTML(combo.hero)}</h3><span class="combo-role">${escapeHTML(combo.role)} · ${escapeHTML(combo.situation)}</span></div></div>
      <div class="combo-sequence" aria-label="Порядок навыков" tabindex="0">${combo.skills.map((skill,i)=>`<span class="combo-step"><b>${escapeHTML(skill)}</b><small>${i===combo.skills.length-1?"Финиш":"Шаг "+(i+1)}</small></span>`).join('<span class="combo-arrow" aria-hidden="true">›</span>')}</div>
      <details class="combo-details"><summary>Показать объяснение комбо</summary><ol>${combo.steps.map(step=>`<li>${escapeHTML(step)}</li>`).join("")}</ol><div class="combo-tip"><strong>Совет MLBB Game</strong><p>${escapeHTML(combo.tip)}</p></div></details>
    </article>`).join("");
}

function syncFilterSelection(container, selector, activeButton) {
  if (!container) return;
  container.querySelectorAll(selector).forEach(button => {
    const selected = button === activeButton;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function setupFilters() {
  $("comboSearch")?.addEventListener("input",renderComboGuides);
  $("comboFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-combo-role]");
    if (!button) return;
    activeComboRole = button.dataset.comboRole;
    syncFilterSelection($("comboFilters"),"[data-combo-role]",button);
    renderComboGuides();
  });
  $("comboGrid")?.addEventListener("click",event=>{
    if (!event.target.closest("[data-combo-reset]")) return;
    activeComboRole = "Все";
    if ($("comboSearch")) $("comboSearch").value = "";
    syncFilterSelection($("comboFilters"),"[data-combo-role]",$("comboFilters")?.querySelector('[data-combo-role="Все"]'));
    renderComboGuides();
  });
  $("roleFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-role]");
    if (!button) return;
    activeRole = button.dataset.role;
    syncFilterSelection($("roleFilters"),"[data-role]",button);
    renderHeroes();
  });

  $("tierSearch")?.addEventListener("input",renderTierList);

  $("tierGrid")?.addEventListener("click",event=>{
    if (!event.target.closest("[data-tier-reset]")) return;
    activeTier = "Все";
    activeTierRole = "Все";
    if ($("tierSearch")) $("tierSearch").value = "";
    syncFilterSelection($("tierFilters"),"[data-tier]",$("tierFilters")?.querySelector('[data-tier="Все"]'));
    syncFilterSelection($("tierRoleFilters"),"[data-tier-role]",$("tierRoleFilters")?.querySelector('[data-tier-role="Все"]'));
    renderTierList();
  });

  $("tierFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-tier]");
    if (!button) return;
    activeTier = button.dataset.tier;
    syncFilterSelection($("tierFilters"),"[data-tier]",button);
    renderTierList();
  });

  $("tierRoleFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-tier-role]");
    if (!button) return;
    activeTierRole = button.dataset.tierRole;
    syncFilterSelection($("tierRoleFilters"),"[data-tier-role]",button);
    renderTierList();
  });

  $("itemFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-category]");
    if (!button) return;
    itemCategory = button.dataset.category;
    syncFilterSelection($("itemFilters"),"[data-category]",button);
    renderItems();
  });

  $("itemPurposeFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-item-purpose]");
    if (!button) return;
    itemPurpose = button.dataset.itemPurpose;
    syncFilterSelection($("itemPurposeFilters"),"[data-item-purpose]",button);
    renderItems();
  });

  $("itemSort")?.addEventListener("change",event=>{
    itemSort = event.target.value;
    renderItems();
  });

  $("itemOnlyFavorites")?.addEventListener("change",event=>{
    itemOnlyFavorites = event.target.checked;
    renderItems();
  });

  $("perkFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-perk-category]");
    if (!button) return;
    perkCategory = button.dataset.perkCategory;
    syncFilterSelection($("perkFilters"),"[data-perk-category]",button);
    renderPerks();
  });

  $("buildSearch")?.addEventListener("input",event=>{
    buildQuery = event.target.value;
    renderBuilds();
  });
  $("buildHeroPickerSearch")?.addEventListener("input", event => {
    buildHeroPickerQuery = event.target.value || "";
    renderBuildHeroAvatars();
  });
  $("buildHeroAvatars")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-build-hero]");
    if (!button) return;
    buildQuery = button.dataset.buildHero || "";
    buildRoleFilter = "Все";
    buildHeroPickerQuery = "";
    if ($("buildHeroPickerSearch")) $("buildHeroPickerSearch").value = "";
    if ($("buildSearch")) $("buildSearch").value = buildQuery;
    const allRolesButton = $("buildFilters")?.querySelector('[data-build-role="Все"]');
    if (allRolesButton) syncFilterSelection($("buildFilters"),"[data-build-role]",allRolesButton);
    renderBuilds();
    if (typeof window.selectGrimTalentHero === "function") window.selectGrimTalentHero(buildQuery);
    const card = Array.from($("buildGrid")?.querySelectorAll("[data-build-card]") || [])
      .find(element => element.dataset.buildCard === buildQuery);
    if (card) card.scrollIntoView({behavior:"smooth",block:"start"});
  });
  $("buildFilters")?.addEventListener("click",event=>{
    const button = event.target.closest("[data-build-role]");
    if (!button) return;
    buildRoleFilter = button.dataset.buildRole;
    syncFilterSelection($("buildFilters"),"[data-build-role]",button);
    renderBuilds();
  });
}

const EQUIPMENT_RU_NAMES = {
  "fleeting time": "Мимолётное время",
  "great dragon spear": "Копьё великого дракона",
  "malefic gun": "Зловредное ружьё",
  "wind of nature": "Ветер природы",
  "winter crown": "Зимняя корона",
  "fury hammer": "Молот ярости",
  "legion sword": "Меч легиона",
  "magic blade": "Магический клинок",
  "rogue meteor": "Метеор разбойника",
  "swift crossbow": "Скоростной арбалет",
  "expert gloves": "Перчатки мастера",
  "iron hunting bow": "Железный охотничий лук",
  "javelin": "Метательное копьё",
  "vampire mallet": "Вампирский молот",
  "power potion": "Зелье силы",
  "concentrated energy": "Концентрированная энергия",
  "enchanted talisman": "Зачарованный талисман",
  "ice queen wand": "Жезл ледяной королевы",
  "starlium scythe": "Коса старлиума",
  "wishing lantern": "Фонарь желаний",
  "azure blade": "Лазурный клинок",
  "elegant gem": "Изысканный самоцвет",
  "exotic veil": "Экзотическая вуаль",
  "mystic container": "Мистический сосуд",
  "tome of evil": "Фолиант зла",
  "book of sages": "Книга мудрецов",
  "magic necklace": "Магическое ожерелье",
  "mystery codex": "Таинственный кодекс",
  "power crystal": "Кристалл силы",
  "flower of hope": "Цветок надежды",
  "lantern of hope": "Фонарь надежды",
  "brute force breastplate": "Кираса грубой силы",
  "chastise pauldron": "Наплечник наказания",
  "thunder belt": "Грозовой пояс",
  "ares belt": "Пояс Ареса",
  "black ice shield": "Щит чёрного льда",
  "dreadnaught armor": "Броня дредноута",
  "molten essence": "Расплавленная эссенция",
  "silence robe": "Мантия тишины",
  "steel legplates": "Стальные поножи",
  "healing necklace": "Ожерелье исцеления",
  "hero's ring": "Кольцо героя",
  "leather jerkin": "Кожаный дублет",
  "magic resist cloak": "Плащ магической защиты",
  "vitality crystal": "Кристалл жизненной силы",
  "rock potion": "Зелье стойкости",
  "rapid boots": "Ботинки стремительности",
  "allow throw": "Разрешённый бросок",
  "broken heart": "Разбитое сердце",
  "throw forbidden": "Запретный бросок"
};
Object.assign(EQUIPMENT_RU_NAMES, {
  "ogre tomahawk": "Томагавк огра",
  "regular spear": "Обычное копьё",
  "dagger": "Кинжал",
  "iron hunting bow": "Железный охотничий лук",
  "javelin": "Метательное копьё",
  "knife": "Нож",
  "magic wand": "Волшебная палочка",
  "magic potion": "Магическое зелье",
  "demon boots": "Демонические ботинки",
  "magic boots": "Магические ботинки",
  "boots": "Ботинки"
});
Object.assign(EQUIPMENT_RU_NAMES, {
  "fleeting time": "Мимолётное время",
  "great dragon spear": "Копьё великого дракона",
  "malefic gun": "Зловредное ружьё",
  "wind of nature": "Ветер природы",
  "winter crown": "Зимняя корона",
  "ogre tomahawk": "Томагавк огра",
  "regular spear": "Обычное копьё",
  "dagger": "Кинжал",
  "iron hunting bow": "Железный охотничий лук",
  "javelin": "Метательное копьё",
  "knife": "Нож",
  "concentrated energy": "Концентрированная энергия",
  "enchanted talisman": "Зачарованный талисман",
  "ice queen wand": "Жезл ледяной королевы",
  "starlium scythe": "Коса старлиума",
  "wishing lantern": "Фонарь желаний",
  "azure blade": "Лазурный клинок",
  "elegant gem": "Изысканный самоцвет",
  "exotic veil": "Экзотическая вуаль",
  "mystic container": "Мистический сосуд",
  "tome of evil": "Фолиант зла",
  "book of sages": "Книга мудрецов",
  "magic wand": "Волшебная палочка",
  "mystery codex": "Таинственный кодекс",
  "power crystal": "Кристалл силы",
  "flower of hope": "Цветок надежды",
  "lantern of hope": "Фонарь надежды",
  "magic potion": "Магическое зелье",
  "brute force breastplate": "Кираса грубой силы",
  "chastise pauldron": "Наплечник наказания",
  "thunder belt": "Грозовой пояс",
  "ares belt": "Пояс Ареса",
  "black ice shield": "Щит чёрного льда",
  "dreadnaught armor": "Броня дредноута",
  "molten essence": "Расплавленная эссенция",
  "silence robe": "Мантия тишины",
  "steel legplates": "Стальные поножи",
  "healing necklace": "Ожерелье исцеления",
  "hero's ring": "Кольцо героя",
  "leather jerkin": "Кожаный дублет",
  "magic resist cloak": "Плащ магической защиты",
  "vitality crystal": "Кристалл жизненной силы",
  "rock potion": "Зелье стойкости",
  "demon boots": "Демонические ботинки",
  "magic boots": "Магические ботинки",
  "rapid boots": "Ботинки стремительности",
  "boots": "Ботинки",
  "allow throw": "Разрешённый бросок",
  "broken heart": "Разбитое сердце",
  "throw forbidden": "Запретный бросок"
});
function translateEquipmentName(name) { const key = String(name || '').trim().toLocaleLowerCase(); return EQUIPMENT_RU_NAMES[key] || name; }

async function fetchCatalogWithLocalFallback(remoteUrl, localUrl, label) {
  let remoteError;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(remoteUrl, { cache: "no-cache", signal: controller.signal });
    if (!response.ok) throw new Error(label + ": внешний источник недоступен");
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error(label + ": неверный формат внешнего каталога");
    return { data, source: "external" };
  } catch (error) {
    remoteError = error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  try {
    const response = await fetch(localUrl, { cache: "no-cache" });
    if (!response.ok) throw new Error(label + ": локальный резервный каталог недоступен");
    const data = await response.json();
    if (!Array.isArray(data) || !data.length) throw new Error(label + ": неверный формат локального каталога");
    return { data, source: "local" };
  } catch (localError) {
    console.warn("MLBB Game: не удалось загрузить ни внешний, ни локальный каталог " + label + ".", localError);
    throw remoteError || localError;
  }
}

async function loadExternalItems() {
  try {
    const { data, source: catalogSource } = await fetchCatalogWithLocalFallback(
      EQUIPMENT_SOURCE,
      "data/equipment-catalog.json",
      "предметов"
    );
    itemDataSource = catalogSource;
    const existingNames = new Set(items.map(item=>String(item.name).toLocaleLowerCase()));
    const categoryFor = (name,index) => {
      const value = String(name).toLocaleLowerCase();
      if (/retribution/.test(value)) return "Jungle";
      if (/conceal|dire hit|encourage|favor/.test(value)) return "Roam";
      if (/allow throw|broken heart|throw forbidden/.test(value)) return "Movement";
      if (/boots|shoes/.test(value)) return "Movement";
      if (/wand|crystal|codex|tome|magic necklace|book of sages|flower of hope|lantern of hope|wishing lantern|concentrated energy|starlium|lightning truncheon|holy crystal|divine glaive|genius wand|glowing wand|ice queen|blood wings|feather of heaven|clock of destiny|enchanted talisman|mystic container|azure blade|elegant gem|exotic veil|fleeting time|winter crown|flask of the oasis|magic potion/.test(value)) return "Magic";
      if (/armor|shield|helmet|breastplate|guardian|immortality|oracle|wings|belt|cloak|jerkin|legplates|vitality|healing necklace|rock potion|black ice|dreadnaught|molten essence|silence robe|chastise|thunder belt|dominance|athena|antique|radiant|cursed|queen's wings|hero's ring/.test(value)) return "Defense";
      if (/potion/.test(value)) return "Attack";
      if (/dagger|spear|sword|bow|glove|scythe|malefic|fury|corrosion|despair|heptaseas|hunter strike|wind of nature|windtalker|sky piercer|hunting bow|knife|crossbow|vampire mallet|ogre tomahawk|regular spear|rogue meteor|haas's claws|berserker|endless battle|golden staff|rose gold meteor|sea halberd|war axe|javelin|magic blade/.test(value)) return "Attack";
      return "Other";
    };
    data.forEach((entry,index)=>{
      const name = String(entry["name-equipment"] || "").trim();
      if (!name || existingNames.has(name.toLocaleLowerCase())) return;
      const imageFile = String(entry["logo-equipment"] || "").trim();
      const price = Number(entry["prize-gold"]);
      const cat = categoryFor(name,index);
      items.push({
        id:"catalog-" + name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
        name,
        ru:translateEquipmentName(name),
        cat,
        imageFile,
        stats:Number.isFinite(price) && price > 0 ? "Цена: " + price.toLocaleString("ru-RU") + " золота" : "Цена не указана",
        desc:"Предмет из каталога Mobile Legends: Bang Bang. Цена и доступность могут меняться в обновлениях.",
        tip:"Проверь наличие, цену и характеристики предмета в актуальной версии игры."
      });
      existingNames.add(name.toLocaleLowerCase());
    });
    renderItems();
    renderPerks();
    renderBuilds();
    renderFavorites();
    // renderItems() owns the visible count so active search, category and favorites filters stay accurate.
  } catch (error) {
    console.warn("MLBB Game: внешний каталог предметов недоступен.",error);
  }
}

async function loadExternalHeroes() {
  const note = $("heroSourceNote");
  try {
    const { data, source: catalogSource } = await fetchCatalogWithLocalFallback(
      HERO_SOURCE,
      "data/hero-catalog.json",
      "героев"
    );

    const normalized = data.map(normalizeRemoteHero).filter(Boolean);
    if (!normalized.length) throw new Error("Не удалось обработать каталог героев");

    const remoteIdToFallbackId = new Map();
    data.forEach((sourceHero, index) => {
      const sourceName = sourceHero.name_hero || sourceHero.name || sourceHero.nameHero || sourceHero.hero_name;
      const sourceId = String(sourceHero.id_hero ?? sourceHero.id ?? "remote-" + index);
      const fallback = fallbackHeroes.find(item => item.name.toLowerCase() === String(sourceName || "").toLowerCase());
      if (fallback) remoteIdToFallbackId.set(sourceId, String(fallback.id));
    });
    favoriteHeroes = new Set([...favoriteHeroes].map(id => remoteIdToFallbackId.get(String(id)) || String(id)));
    safeWrite("grimgg-favorite-heroes", favoriteHeroes);
    heroes = normalized;
    heroDataSource = catalogSource;
    if (note) note.textContent = catalogSource === "external"
      ? "Загружен сторонний каталог сообщества. Он неофициальный и может отставать от текущего патча; роли обозначают классы героев, а не рекомендуемые линии."
      : "Внешний каталог недоступен: используется локальный резервный снимок из 133 записей сообщества. Он неофициальный и может отставать от текущего патча.";
    renderHeroes();
    renderQuickHeroSearch();
    renderTierList();
    renderBuilds();
    renderComboGuides();
    renderFavorites();
    if (new URLSearchParams(window.location.search).get("page") === "hero") {
      renderHeroFullPage(new URLSearchParams(window.location.search).get("name"));
    }
  } catch (error) {
    heroDataSource = "fallback";
    if (note) note.textContent = "Не удалось загрузить каталоги. Показан сокращённый встроенный список; он не является полным каталогом игры.";
    console.warn("MLBB Game: не удалось загрузить внешний и локальный каталоги героев.",error);
  }
}


function applyPageNavigation(requestedPage, shouldScroll = true) {
  const pageIds = ["home","heroes","tierlist","items","perks","talents","builds","favorites","guides","esports","download","hero"];
  // Keep old talent-page links working, but show the unified builds + talents workspace.
  const page = requestedPage === "talents" ? "builds" : pageIds.includes(requestedPage) ? requestedPage : "home";
  const visibleSection = page === "hero" ? "hero-detail" : page;

  document.querySelectorAll("main > section").forEach(section => {
    const isHeroDetail = section.id === "hero-detail";
    section.classList.toggle("page-hidden", isHeroDetail ? page !== "hero" : Boolean(page) && section.id !== visibleSection);
  });

  document.querySelectorAll("#nav a").forEach(link => {
    const linkPage = new URLSearchParams(link.search).get("page");
    if (page && linkPage === page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const titles = {
    home: "Главная",
    heroes: "Герои",
    tierlist: "Тир-лист",
    items: "Предметы",
    perks: "Перки и заклинания",
    talents: "Таланты и эмблемы",
    builds: "Сборки и таланты",
    favorites: "Избранное",
    guides: "Комбо и гайды",
    esports: "Киберспорт",
    download: "Скачать приложение",
    hero: "Профиль героя"
  };
  document.title = page ? `MLBB Game — ${titles[page]}` : "MLBB Game — тактическая база Mobile Legends";

  if (shouldScroll) window.scrollTo({ top: 0, behavior: "auto" });
}


let deferredInstallPrompt = null;

function setupAppInstall() {
  const installButton = $("installAndroidApp");
  const status = $("installStatus");
  const copyButton = $("copySiteLink");
  const say = message => { if (status) status.textContent = message; };

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) {
      installButton.disabled = false;
      installButton.textContent = "Установить приложение";
    }
    say("Браузер поддерживает быструю установку MLBB Game — нажми кнопку выше.");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    if (installButton) {
      installButton.disabled = true;
      installButton.textContent = "Приложение установлено";
    }
    say("MLBB Game установлен. Ищи его значок на главном экране телефона.");
  });

  installButton?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      say("Быстрая установка сейчас недоступна в этом браузере. На Android открой сайт в Chrome, нажми меню ⋮ и выбери «Установить приложение» или «Добавить на главный экран». На iPhone используй Safari и меню «Поделиться» → «На экран Домой».");
      return;
    }
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice?.outcome === "accepted") {
      say("Установка подтверждена. Подожди, пока MLBB Game появится среди приложений.");
    } else {
      say("Установка пока не завершена. Ты можешь вернуться и попробовать ещё раз или воспользоваться инструкцией ниже.");
    }
  });

  copyButton?.addEventListener("click", async () => {
    const link = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(link);
      say("Ссылка на MLBB Game скопирована. Отправь её друзьям, чтобы они тоже могли установить сайт.");
    } catch {
      say("Скопируй ссылку вручную: " + link);
    }
  });

  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (isStandalone) {
    if (installButton) {
      installButton.disabled = true;
      installButton.textContent = "MLBB Game уже установлен";
    }
    say("Похоже, MLBB Game уже установлен на этом устройстве. Можешь поделиться ссылкой с друзьями.");
  } else if (isIOS) {
    say("Для iPhone: открой эту страницу в Safari → «Поделиться» → «На экран Домой» → «Добавить».");
  }
}

function setupPageNavigation() {
  const getRequestedPage = () => new URLSearchParams(window.location.search).get("page");
  const applyRoleFromUrl = () => {
    if (getRequestedPage() !== "heroes") return;
    const requestedRole = new URLSearchParams(window.location.search).get("role");
    const supportedRoles = ["Убийца","Маг","Стрелок","Боец","Танк","Поддержка"];
    activeRole = supportedRoles.includes(requestedRole) ? requestedRole : "Все";
    syncFilterSelection($("roleFilters"), "[data-role]", $("roleFilters")?.querySelector('[data-role="' + activeRole + '"]'));
    renderHeroes();
  };
  applyPageNavigation(getRequestedPage(), false);
  applyRoleFromUrl();

  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.searchParams.has("page")) return;

    event.preventDefault();
    closeHeroDetail();
    closeHeroBuild();
    if (url.href !== window.location.href) history.pushState({}, "", url.href);
    applyPageNavigation(url.searchParams.get("page"));
    applyRoleFromUrl();
    if (url.hash) {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) target.scrollIntoView({behavior:"smooth",block:"start"});
    }
    if (url.searchParams.get("page") === "hero") renderHeroFullPage(url.searchParams.get("name"));
    const nav = $("nav");
    const toggle = $("menuToggle");
    nav?.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  });

  window.addEventListener("popstate", () => {
    applyPageNavigation(getRequestedPage(), false);
    applyRoleFromUrl();
    if (getRequestedPage() === "hero") renderHeroFullPage(new URLSearchParams(window.location.search).get("name"));
  });
  if (getRequestedPage() === "hero") renderHeroFullPage(new URLSearchParams(window.location.search).get("name"));
}

function setupMenu() {
  const toggle = $("menuToggle");
  const nav = $("nav");
  if (!toggle || !nav) return;

  const setMenuOpen = open => {
    toggle.setAttribute("aria-expanded",String(open));
    toggle.setAttribute("aria-label",open ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("open",open);
  };

  toggle.addEventListener("click",()=>{
    setMenuOpen(toggle.getAttribute("aria-expanded")!=="true");
  });

  nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>setMenuOpen(false)));
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape") setMenuOpen(false);
  });
}

function setupBackToTop() {
  const button = $("backToTop");
  if (!button) return;

  const updateVisibility = () => {
    const shouldShow = window.scrollY > 420;
    button.hidden = !shouldShow;
    button.classList.toggle("is-visible", shouldShow);
  };

  window.addEventListener("scroll", updateVisibility, { passive: true });
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  updateVisibility();
}


const ESPORTS_NEWS_URL = "data/esports-news.json";
let esportsRefreshTimer = null;

function formatEsportsDate(value) {
  if (!value) return "Дата не указана";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Kyiv" }).format(parsed);
}

function renderEsportsNews(newsData) {
  const grid = $("esportsNewsGrid");
  const feature = $("esportsFeaturedNews");
  const updated = $("esportsLastUpdated");
  if (!grid || !Array.isArray(newsData?.articles) || !newsData.articles.length) {
    if (grid) grid.innerHTML = '<article class="esports-card"><h3>Пока нет свежих публикаций</h3><p>Попробуй обновить страницу позже или открой официальный сайт MOONTON.</p><a class="esports-link" href="https://en.moonton.com/news/index.html" target="_blank" rel="noopener noreferrer">Официальные новости ↗</a></article>';
    if (updated) updated.textContent = "Источник временно недоступен";
    return;
  }

  const articles = newsData.articles.filter(item => item && typeof item.title === "string" && typeof item.url === "string" && /^https:\/\/en\.moonton\.com\/news\/[\w-]+\.html(?:[?#].*)?$/.test(item.url)).slice(0, 18);
  if (!articles.length) return;

  const makeTag = title => {
    const text = String(title || "MLBB ESPORTS").toLocaleUpperCase("ru-RU");
    return text.length > 38 ? text.slice(0, 35) + "…" : text;
  };
  const makeLink = (url, label) => {
    const a = document.createElement("a");
    a.className = "esports-link";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = label;
    return a;
  };

  if (feature) {
    const first = articles[0];
    const tag = feature.querySelector(".esports-tag");
    const heading = feature.querySelector("h3");
    const paragraph = feature.querySelector("p");
    const link = feature.querySelector("a.esports-link");
    const meta = feature.querySelector(".esports-meta");
    if (tag) tag.textContent = "ПОСЛЕДНЯЯ НОВОСТЬ";
    if (heading) heading.textContent = first.title;
    if (paragraph) paragraph.textContent = first.description || "Открой источник, чтобы прочитать полную новость.";
    if (link) { link.href = first.url; link.textContent = "Читать новость ↗"; }
    if (meta) meta.textContent = [formatEsportsDate(first.published), "Официальный источник: MOONTON Games"].filter(Boolean).join(" · ");
  }

  const fragment = document.createDocumentFragment();
  articles.slice(1).forEach(item => {
    const card = document.createElement("article");
    card.className = "esports-card";
    const top = document.createElement("div");
    top.className = "esports-card-top";
    const tag = document.createElement("span");
    tag.className = "esports-tag";
    tag.textContent = "MOONTON / MLBB";
    const date = document.createElement("span");
    date.className = "esports-date";
    date.textContent = formatEsportsDate(item.published);
    top.append(tag, date);
    const heading = document.createElement("h3");
    heading.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description || "Открой официальную публикацию для подробностей.";
    card.append(top, heading, description, makeLink(item.url, "Подробнее ↗"));
    fragment.append(card);
  });
  grid.replaceChildren(fragment);
  if (updated) {
    const stamp = newsData.updatedAt ? new Date(newsData.updatedAt) : null;
    updated.textContent = stamp && !Number.isNaN(stamp.getTime())
      ? "Лента обновлена " + new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", timeZone: "Europe/Kyiv" }).format(stamp) + " · Киев"
      : "Автоматическая лента MOONTON Games";
  }
}

async function loadEsportsNews() {
  try {
    const response = await fetch(ESPORTS_NEWS_URL + "?t=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("News feed HTTP " + response.status);
    const data = await response.json();
    renderEsportsNews(data);
  } catch (error) {
    const updated = $("esportsLastUpdated");
    if (updated) updated.textContent = "Не удалось обновить ленту — показаны доступные данные";
    const grid = $("esportsNewsGrid");
    if (grid) grid.innerHTML = '<article class="esports-card"><h3>Не удалось загрузить ленту</h3><p>Проверь подключение и попробуй ещё раз. Можно открыть официальный источник.</p><a class="esports-link" href="https://en.moonton.com/news/index.html" target="_blank" rel="noopener noreferrer">Открыть MOONTON ↗</a></article>';
  }
  if (!esportsRefreshTimer) esportsRefreshTimer = window.setInterval(loadEsportsNews, 5 * 60 * 1000);
}

function init() {
  $("year").textContent = new Date().getFullYear();

  favoriteHeroes = new Set(safeRead("grimgg-favorite-heroes").map(String));
  favoriteItems = new Set(safeRead("grimgg-favorite-items").map(String));
  
  // Keep the selected filter state available to assistive technology.
  document.querySelectorAll("[data-role],[data-tier],[data-tier-role],[data-category],[data-item-purpose],[data-perk-category],[data-build-role],[data-combo-role]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
  });

  $("heroSearch").addEventListener("input",event=>{
    heroQuery = event.target.value.trim().toLocaleLowerCase();
    renderHeroes();
  });

  $("quickHeroSearch")?.addEventListener("input", renderQuickHeroSearch);
  $("quickHeroSearch")?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $("quickHeroResults").hidden = true;
      return;
    }
    if (event.key === "Enter") {
      const firstResult = $("quickHeroResults")?.querySelector("[data-open-hero-full]");
      if (firstResult) {
        event.preventDefault();
        firstResult.click();
      }
    }
  });

  $("itemSearch").addEventListener("input",event=>{
    itemQuery = event.target.value.trim().toLocaleLowerCase();
    renderItems();
  });

  $("perkSearch")?.addEventListener("input",event=>{
    perkQuery = event.target.value.trim().toLocaleLowerCase();
    renderPerks();
  });

  $("favHeroesTab").addEventListener("click",()=>{
    favoriteTab = "heroes";
    renderFavorites();
  });
  $("favItemsTab").addEventListener("click",()=>{
    favoriteTab = "items";
    renderFavorites();
  });

  document.addEventListener("click",event=>{
    const openHeroButton = event.target.closest("[data-open-hero]");
    if (openHeroButton) {
      // Профиль сразу показывает навыки/комбо и сборку на одной панели.
      openHeroDetail(openHeroButton.dataset.openHero);
      return;
    }
    const fullHeroButton = event.target.closest("[data-open-hero-full]");
    if (fullHeroButton) {
      const heroName = fullHeroButton.dataset.openHeroFull;
      const url = new URL(window.location.href);
      url.searchParams.set("page", "hero");
      url.searchParams.set("name", heroName);
      closeHeroDetail();
      closeHeroBuild();
      history.pushState({}, "", url.href);
      applyPageNavigation("hero");
      renderHeroFullPage(heroName);
      return;
    }
    if (event.target.closest("[data-close-hero]")) {
      closeHeroDetail();
      return;
    }
    const openBuildButton = event.target.closest("[data-open-build]");
    if (openBuildButton) {
      closeHeroDetail();
      openHeroBuild(openBuildButton.dataset.openBuild, openBuildButton.dataset.buildRoles);
      return;
    }
    const variantButton = event.target.closest("[data-build-variant]");
    if (variantButton) {
      activeBuildVariant = variantButton.dataset.buildVariant;
      renderHeroBuildModal();
      return;
    }
    const talentToggle = event.target.closest(".build-talent-toggle");
    if (talentToggle) {
      const expanded = talentToggle.getAttribute("aria-expanded") === "true";
      talentToggle.setAttribute("aria-expanded", String(!expanded));
      const description = document.getElementById(talentToggle.getAttribute("aria-controls"));
      if (description) description.hidden = expanded;
      const indicator = talentToggle.querySelector(".build-talent-expand");
      if (indicator) indicator.textContent = expanded ? "+" : "−";
      return;
    }
    if (event.target.closest("[data-close-build]")) {
      closeHeroBuild();
      return;
    }
    const button = event.target.closest("[data-favorite-type]");
    if (!button) return;
    updateFavorite(button.dataset.favoriteType,button.dataset.favoriteId);
  });

  document.addEventListener("change", event => {
    if (event.target && event.target.id === "buildTalentStyle") {
      activeBuildTalentStyle = event.target.value;
      renderHeroBuildModal();
    }
  });
  setupPageNavigation();
  setupAppInstall();
  setupBackToTop();
  setupFilters();
  setupMenu();
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape") {
      closeHeroDetail();
      closeHeroBuild();
    }
  });
  renderHeroes();
  renderItems();
  renderPerks();
  renderBuilds();
  renderComboGuides();
  renderFavorites();

  loadExternalHeroes();
  loadExternalItems();
  loadEsportsNews();
  $("refreshEsportsNews")?.addEventListener("click", () => {
    const button = $("refreshEsportsNews");
    if (button) { button.disabled = true; button.textContent = "Обновляем…"; }
    loadEsportsNews().finally(() => {
      if (button) { button.disabled = false; button.textContent = "Обновить ленту ↻"; }
    });
  });
}

document.addEventListener("DOMContentLoaded",init);
