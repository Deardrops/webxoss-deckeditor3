// Search rules - ported from Rules.js
// Each rule parses keywords from search query and returns a filter function
import type { CardInfo } from './types';
import { getCardInfo } from './CardDatabase';

type FilterFn = (info: CardInfo) => boolean;

interface RuleParser {
  parse(words: string[]): FilterFn;
}

// TextualRule: matches card properties against keyword maps
class TextualRule implements RuleParser {
  constructor(
    private prop: keyof CardInfo,
    private map: Record<string, string[]>,
    private exact: boolean
  ) {}

  parse(words: string[]): FilterFn {
    const keywords: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const keyword = this.parseWord(words[i]);
      if (!keyword) continue;
      keywords.push(keyword);
      words.splice(i, 1);
      i--;
    }
    const prop = this.prop;
    const exact = this.exact;
    return (info: CardInfo) => {
      if (!keywords.length) return true;
      return keywords.some(keyword => {
        const value = ('' + (info as unknown as Record<string, unknown>)[prop]).toLowerCase();
        return exact ? value === keyword : value.indexOf(keyword) !== -1;
      });
    };
  }

  parseWord(word: string): string | null {
    for (const keyword in this.map) {
      const matchWords = this.map[keyword];
      if (matchWords.some(mw => word === traditionalize(mw))) {
        return keyword;
      }
    }
    return null;
  }
}

// Localize.traditionalize wrapper
function traditionalize(str: string): string {
  if (window.Localize?.traditionalize) {
    return window.Localize.traditionalize(str);
  }
  return str;
}

function localizeClass(cls: string): string {
  if (window.Localize) {
    return window.Localize('class', cls).toLowerCase();
  }
  return cls.toLowerCase();
}

// Enumeration rules
const ColorRule = new TextualRule('color', {
  'colorless': ['colorless','无','无色','無','incolore','무','무색'],
  'white': ['white','白','白色','白','белая','bianco','백','백색'],
  'black': ['black','黑','黑色','黒','чёрная','nero','흑','흑색'],
  'red': ['red','红','红色','赤','красная','rosso','적','적색'],
  'blue': ['blue','蓝','蓝色','青','синяя','blu','청','청색'],
  'green': ['green','绿','绿色','緑','зелёная','verde','녹','녹색']
}, false);

const TypeRule = new TextualRule('cardType', {
  'lrig': ['l','lrig','分身','ルリグ','идел','루리그'],
  'signi': ['s','signi','精灵','シグニ','запись','시그니'],
  'spell': ['spell','魔法','スペル','магия','스펠'],
  'arts': ['arts','必杀','技艺','アーツ','умение','아츠'],
  'resona': ['resona','共鸣','レゾナ','отголосок','레조나']
}, true);

const RarityRule = new TextualRule('rarity', {
  'c': ['c'], 'r': ['r'], 'lc': ['lc'], 'sr': ['sr'],
  'lr': ['lr'], 'st': ['st'], 'pr': ['pr'], 'sp': ['sp']
}, true);

const RiseRule = new TextualRule('rise' as keyof CardInfo, {
  'true': ['rise','升阶','ライズ'],
}, true);

const TrapRule = new TextualRule('trap' as keyof CardInfo, {
  'true': ['trap','陷阱','陷阱标记','トラップ'],
}, true);

const AcceRule = new TextualRule('acce' as keyof CardInfo, {
  'true': ['acce','accessory','附属','アクセ'],
}, true);

// SkillRule: matches effect text property presence
const SkillRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const effectProps: string[] = [];
    const skillMap: Record<string, string[]> = {
      'constEffectTexts': [
        '【常】','常','常时','常时效果','常時能力',
        '【常】','常','常時','常時效果','常時能力',
        '[constant]','const','constant',
        '[постоянно]','постоянно',
        '상시','[상시]'
      ],
      'startUpEffectTexts': [
        '【出】','出','出场','出场效果','出场能力',
        '【出】','出','出現','出現效果','出現能力',
        '[on-play]','[onplay]','on-play','onplay',
        '[при вводе]','при вводе',
        '출현','[출현]'
      ],
      'actionEffectTexts': [
        '【起】','起','起动','起动效果','起动能力',
        '【起】','起','起動','起動效果','起動能力',
        '[action]','action',
        '[действие]','действие',
        '기동','[기동]',
      ],
      'burstEffectTexts': [
        '※','爆发','迸发','爆发效果','迸发效果','生命爆发','生命迸发',
        'ライフバースト','バースト',
        'burst','lifeburst','lb',
        'вспышка','жизненная вспышка',
        '라이프 버스트','라이프버스트','버스트'
      ]
    };
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (const prop in skillMap) {
        if (skillMap[prop].some(mw => word === traditionalize(mw))) {
          effectProps.push(prop);
          words.splice(i, 1);
          i--;
          break;
        }
      }
    }
    return (info: CardInfo) => {
      if (!effectProps.length) return true;
      const cardDb = getCardInfo();
      const cidInfo = cardDb[String(info.cid)] || info;
      return effectProps.some(prop => {
        const texts = (cidInfo as unknown as Record<string, unknown>)[prop];
        return Array.isArray(texts) && texts.length > 0;
      });
    };
  }
};

// NoBurstRule
const NoBurstRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const noBurstKeywords = [
      '无爆发','无迸发','noburst',
      'ライフバースト-','バースト-',
      '迸发-','爆发-','burst-','lifeburst-','lb-',
      'вспышка-','жизненная вспышка-',
      '버스트-','라이프버스트-'
    ];
    let matched = false;
    for (let i = 0; i < words.length; i++) {
      if (noBurstKeywords.some(kw => words[i] === traditionalize(kw))) {
        matched = true;
        words.splice(i, 1);
        i--;
      }
    }
    return (info: CardInfo) => {
      if (!matched) return true;
      const cardDb = getCardInfo();
      const cidInfo = cardDb[String(info.cid)] || info;
      return (cidInfo.cardType === 'SIGNI' || cidInfo.cardType === 'SPELL') &&
        (!cidInfo.burstEffectTexts || !cidInfo.burstEffectTexts.length);
    };
  }
};

// CrossRule
const CrossRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const crossKeywords = [
      'cross','交错','クロス','связь','크로스',
      '[cross]','>cross<','【cross】','【交错】','【クロス】','[связь]','>크로스<'
    ];
    let matched = false;
    for (let i = 0; i < words.length; i++) {
      if (crossKeywords.some(kw => words[i] === traditionalize(kw))) {
        matched = true;
        words.splice(i, 1);
        i--;
      }
    }
    return (info: CardInfo) => {
      if (!matched) return true;
      const cardDb = getCardInfo();
      const cidInfo = cardDb[String(info.cid)] || info;
      return cidInfo.cardType === 'SIGNI' && (!!cidInfo.crossLeft || !!cidInfo.crossRight);
    };
  }
};

// TimmingRule
const TimmingRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const timmingMap: Record<string, string[]> = {
      'mainPhase': [
        '主要阶段','【主要阶段】','主要',
        'メインフェイズ','【メインフェイズ】',
        '[mainphase]','mainphase','main',
        '[основнаяфаза]','основнаяфаза','основная',
        '메인','메인페이즈','[메인페이즈]'
      ],
      'attackPhase': [
        '攻击阶段','【攻击阶段】','攻击',
        'アタックフェイズ','【アタックフェイズ】',
        '[attackphase]','attackphase','attack',
        '[фазаатаки]','фазаатаки','атака',
        '어택','어택페이즈','[어택페이즈]'
      ],
      'spellCutIn': [
        '魔法切入','【魔法切入】','切入',
        'スペルカットイン','【スペルカットイン】',
        '[spellcut-in]','[cut-in]','[spellcutin]','[cutin]','spellcutin','cutin','cut',
        '[ответнамагию]','[ответ]','ответнамагию','ответ',
        '컷인','[스펠컷인]','스펠컷인'
      ]
    };
    const timmings: string[] = [];
    for (let i = 0; i < words.length; i++) {
      for (const timming in timmingMap) {
        if (timmingMap[timming].some(kw => words[i] === traditionalize(kw))) {
          timmings.push(timming);
          words.splice(i, 1);
          i--;
          break;
        }
      }
    }
    return (info: CardInfo) => {
      if (!timmings.length) return true;
      return timmings.some(t => info.timmings?.includes(t) ?? false);
    };
  }
};

// LimitingRule
const LimitingRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const matchedClasses: string[] = [];
    let flagNoLimiting = false;
    const classes = [
      'タマ','花代','ユヅキ','ピルルク','エルドラ','ミルルン','緑子',
      'アン','ウリス','イオナ','ウムル','リメンバ','タウィル','サシェ',
      'ミュウ','アイヤイ','アルフォウ','ハナレ','リル','メル',
      'あや','ナナシ','ドーナ','ママ'
    ];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (const cls of classes) {
        const localized = localizeClass(cls);
        let matched = false;
        if (word === localized) {
          matched = true;
        } else if (word === localized + '+') {
          matched = true;
          flagNoLimiting = true;
        }
        if (matched) {
          matchedClasses.push(cls);
          words.splice(i, 1);
          i--;
          break;
        }
      }
    }
    return (info: CardInfo) => {
      if (!matchedClasses.length) return true;
      if (info.cardType === 'LRIG') {
        return matchedClasses.some(cls => info.classes?.includes(cls) ?? false);
      }
      if (!info.limiting) return flagNoLimiting;
      const limitings = info.limiting.split('/');
      return limitings.some(l => matchedClasses.includes(l));
    };
  }
};

// ClassRule
const ClassRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const matchedClasses: string[] = [];
    const classes = [
      '精像','天使','悪魔','美巧','精武','アーム','ウェポン','遊具',
      '毒牙','精羅','鉱石','宝石','植物','原子','宇宙','精械','電機',
      '古代兵器','迷宮','精生','水獣','空獣','地獣','龍獣','凶蟲','精元',
      '武勇','調理','トリック','英知','微菌','怪異',
    ];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (const cls of classes) {
        if (word === localizeClass(cls).replace(/ /g, '')) {
          matchedClasses.push(cls);
          words.splice(i, 1);
          i--;
          break;
        }
      }
    }
    return (info: CardInfo) => {
      if (!matchedClasses.length) return true;
      return matchedClasses.some(cls => info.classes?.includes(cls) ?? false);
    };
  }
};

// NumericRule
class NumericRule implements RuleParser {
  constructor(
    private prop: string,
    private keywords: string[]
  ) {}

  parseExpression(str: string): [number, number] | null {
    let match: RegExpMatchArray | null;
    // Equal
    match = str.match(/^=*(\d+)$/);
    if (match) {
      const num = parseInt(match[1]);
      return [num, num];
    }
    // Greater than
    match = str.match(/^>=*(\d+)\+?$/);
    if (!match) match = str.match(/^(\d+)\+$/);
    if (match) {
      const num = parseInt(match[1]);
      return [num, Infinity];
    }
    // Less than
    match = str.match(/^<=*(\d+)\-?$/);
    if (!match) match = str.match(/^(\d+)\-$/);
    if (match) {
      const num = parseInt(match[1]);
      return [-Infinity, num];
    }
    // Range
    match = str.match(/^(\d+)[\-~](\d+)$/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2])];
    }
    return null;
  }

  parseWord(word: string): [number, number] | null {
    for (const keyword of this.keywords) {
      const k = traditionalize(keyword);
      if (word.indexOf(k) === 0) {
        const rest = word.slice(k.length).replace(/^:/, '');
        return this.parseExpression(rest);
      }
    }
    return null;
  }

  parse(words: string[]): FilterFn {
    const ranges: [number, number][] = [];
    for (let i = 0; i < words.length; i++) {
      const range = this.parseWord(words[i]);
      if (!range) continue;
      ranges.push(range);
      words.splice(i, 1);
      i--;
    }
    const prop = this.prop;
    return (info: CardInfo) => {
      if (!ranges.length) return true;
      if (info.cardType === 'SPELL' || info.cardType === 'ARTS') return false;
      return ranges.every(([min, max]) => {
        const value = (info as unknown as Record<string, unknown>)[prop] as number;
        return value >= min && value <= max;
      });
    };
  }
}

const PowerRule = new NumericRule('power', ['力量','パワー','power','сила','파워']);
const LevelRule = new NumericRule('level', ['等级','レベル','level','lv.','lv','уровень','livello','레벨']);
const LimitRule = new NumericRule('limit', ['界限','リミット','limite','limit','ограничение','리미트']);

// NumberRule - infers level vs power based on magnitude
const NumberRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const numRule = new NumericRule('', ['']);
    const ranges: [number, number][] = [];
    for (let i = 0; i < words.length; i++) {
      const range = numRule.parseWord(words[i]);
      if (!range) continue;
      ranges.push(range);
      words.splice(i, 1);
      i--;
    }
    return (info: CardInfo) => {
      return ranges.every(([min, max]) => {
        if (info.cardType === 'SPELL' || info.cardType === 'ARTS') return false;
        const isLevel = (!isFinite(min) || min < 10) && (!isFinite(max) || max < 10);
        const value = isLevel ? info.level : info.power;
        return value >= min && value <= max;
      });
    };
  }
};

// IllustRule
const IllustRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const illusts: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let match = word.match(/illust:?(.+)/);
      if (!match) match = word.match(/画师:?(.+)/);
      if (!match) match = word.match(/畫師:?(.+)/);
      if (!match) continue;
      illusts.push(match[1]);
      words.splice(i, 1);
      i--;
    }
    return (info: CardInfo) => {
      if (!illusts.length) return true;
      return illusts.some(ill => info.illust.toLowerCase().indexOf(ill) !== -1);
    };
  }
};

// WxidRule
const WxidRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const idLimits: string[] = [];
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const match = word.match(/^(wx\d{2}|wd\d{2}|pr|sp\d{2})-?(re\d{0,2}|cb\d{0,2}|\d{0,3}[ab]?)$/);
      if (!match) continue;
      idLimits.push(match[1] + '-' + match[2]);
      words.splice(i, 1);
      i--;
    }
    return (info: CardInfo) => {
      if (!idLimits.length) return true;
      return idLimits.some(limit => info.wxid.toLowerCase().indexOf(limit) === 0);
    };
  }
};

// NameRule
const dotRegex = /[\u00B7\u0387\u05BC\u2022\u2027\u2219\u22C5\u30FB\uFF0E\uFF65⁑:*†]/g;
const fullWidth =
  '０１２３４５６７８９＝＠＃' +
  'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ' +
  'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ';
const halfWidth =
  '0123456789=@#' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  'abcdefghijklmnopqrstuvwxyz';

function normalizeString(str: string): string {
  const chars = str.replace(dotRegex, '').split('');
  chars.forEach((char, idx) => {
    const i = fullWidth.indexOf(char);
    if (i >= 0) chars[idx] = halfWidth[i];
  });
  return chars.join('').toLowerCase();
}

const NameRule: RuleParser = {
  parse(words: string[]): FilterFn {
    const wordSets: string[][] = [];
    words.forEach(word => {
      wordSets.push(word.split(/\|+/));
    });
    words.length = 0;
    return (info: CardInfo) => {
      return wordSets.every(wordSet => {
        if (!wordSet.length) return true;
        return wordSet.some(word => {
          const name = normalizeString(
            window.Localize ? window.Localize.cardName(info) : info.name
          );
          const w = normalizeString(word);
          return name.indexOf(w) !== -1;
        });
      });
    };
  }
};

// Searcher class - composes all rules
export class Searcher {
  private rules: RuleParser[] = [
    ColorRule, CrossRule, TypeRule, RarityRule,
    RiseRule, TrapRule, AcceRule, SkillRule,
    NoBurstRule, TimmingRule, LimitingRule, ClassRule,
    PowerRule, LevelRule, LimitRule, NumberRule,
    IllustRule, WxidRule, NameRule
  ];

  search(str: string): CardInfo[] {
    const words = str.toLowerCase().split(/\s+/);
    const filters = this.rules.map(rule => rule.parse(words));
    const cardDb = getCardInfo();
    let infos: CardInfo[] = [];
    for (const pid in cardDb) {
      infos.push(cardDb[pid]);
    }
    return filters.reduce((results, filter) => results.filter(filter), infos);
  }
}
