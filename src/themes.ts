import { cacher } from "./caching";

type ColorType = [number, number, number];

export interface ThemeType {
    pageBgColor: ColorType,
    bgColor: ColorType,
    borderBlack: ColorType,
    borderWhite: ColorType,
    gridBorderColor: ColorType,
    scrollbarColor: ColorType,
}

type ThemeAttr = keyof ThemeType;

export const themes: {
    [key: string]: ThemeType
} = {
    'main': {
        pageBgColor: [204, 204, 204], 
        bgColor: [204, 196, 179],
        borderBlack: [0, 0, 0],
        borderWhite: [255, 255, 255],
        gridBorderColor: [179, 179, 179],
        scrollbarColor: [77, 77, 77],
    },
    'dark': {
        pageBgColor: [60, 60, 60],
        bgColor: [57, 57, 57],
        borderBlack: [0, 0, 0],
        borderWhite: [110, 110, 110],
        gridBorderColor: [179, 179, 179],
        scrollbarColor: [77, 77, 77],
    }
}

export const getStyleFromColor = ([r, g, b]: number[]) => {
    return `rgb(${r}, ${g}, ${b})`;
}

export type ThemeName = keyof typeof themes & string;  // JS converts obj[1] to obj["1"], so ThemeName is actually number | string

type ThemeChangesMediatorCallback = (props: {themeName: ThemeName, theme: ThemeType})=>void;

class ThemeChangesMediator {
    callbacks: Map<string, ThemeChangesMediatorCallback>;

    constructor() {
        this.callbacks = new Map();
    }

    publishChangeTheme(themeName: ThemeName) {
        this.callbacks.forEach(cb => {
            cb({
                themeName: themeName,
                theme: themes[themeName]
            });
        })
    }

    subscribe(key: string, cb: ThemeChangesMediatorCallback) {
        this.callbacks.set(key, cb);
    }

    unsubscribe(key: string) {
        this.callbacks.delete(key);
    }
}

interface ThemeProcessorProps {
    defaultTheme: ThemeName
}

class ThemeProcessor {
    currentTheme: ThemeName;
    cssVars: {[key: string]: keyof ThemeType}
    mediator: ThemeChangesMediator;

    constructor(props: ThemeProcessorProps) {
        this.mediator = new ThemeChangesMediator();

        this.cssVars = {
            '--page-bg-color': 'pageBgColor',
            '--bg-color': 'bgColor',
            '--border-gradient-black': 'borderBlack',
            '--border-gradient-white': 'borderWhite',
        }

        this.setTheme(props.defaultTheme, false);

        cacher.readSetting('theme')
            .then((theme) => { 
                this.setTheme(theme || 'main', false)
            })
            .catch((error) => console.error(error));
    }

    setCSSVars() {
        Object.entries(this.cssVars).forEach(([cssVar, color]) => {
            const styledColor = getStyleFromColor(themes[this.currentTheme][color]);
            document.documentElement.style.setProperty(cssVar, styledColor);
        });
    }

    setTheme(theme: ThemeName, save: boolean = true) {
        if (theme === this.currentTheme) {
            return;
        }

        this.currentTheme = theme;
        this.setCSSVars();
        this.mediator.publishChangeTheme(theme);

        if (save) {
            cacher.putSetting({
                id: 'theme',
                value: theme
            });
        }
    }
}

const createThemeObj = (defaultTheme: ThemeName) => {
    const theme = new ThemeProcessor({defaultTheme});

    const attrs = Object.keys(Object.values(themes)[0]) as ThemeAttr[];
    
    const properties = Object.fromEntries(attrs.map(attr => ([
        attr, 
        {
            get: function() {
                return themes[theme.currentTheme][attr];
            }
        }
    ])));

    Object.defineProperties(theme, properties);

    type Styled<Type> = {
        [Property in keyof Type]: string
    }

    const styleObj= {};

    const styleProperties = Object.fromEntries(attrs.map(attr => ([
        attr, 
        {
            get: function() {
                return getStyleFromColor(themes[theme.currentTheme][attr]);
            }
        }
    ])));

    Object.defineProperties(styleObj, styleProperties);

    Object.defineProperty(theme, 'style', {
        value: styleObj,
    });

    return theme as ThemeProcessor & ThemeType & {style: Styled<ThemeType> };
}

const theme = createThemeObj('main');

export {theme as theme};
