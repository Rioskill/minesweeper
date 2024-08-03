type ColorType = [number, number, number];

interface ThemeType {
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
        bgColor: [204, 196, 179],
        borderBlack: [0, 0, 0],
        borderWhite: [255, 255, 255],
        gridBorderColor: [179, 179, 179],
        scrollbarColor: [77, 77, 77],
    },
    'dark': {
        bgColor: [57, 57, 57],
        borderBlack: [0, 0, 0],
        borderWhite: [255, 255, 255],
        gridBorderColor: [179, 179, 179],
        scrollbarColor: [77, 77, 77],
    }
}

export const getStyleFromColor = ([r, g, b]: number[]) => {
    return `rgb(${r}, ${g}, ${b})`;
}

type ThemeName = keyof typeof themes;

interface ThemeChangerProps {
    defaultTheme: ThemeName
}

class ThemeProcessor {
    currentTheme: ThemeName;
    cssVars: {[key: string]: keyof ThemeType}

    constructor(props: ThemeChangerProps) {
        this.cssVars = {
            '--bg-color': 'bgColor',
            '--border-gradient-black': 'borderBlack',
            '--border-gradient-white': 'borderWhite',
        }

        this.setTheme(props.defaultTheme);
    }

    setTheme(theme: ThemeName) {
        this.currentTheme = theme;
        Object.entries(this.cssVars).forEach(([cssVar, color]) => {
            const styledColor = getStyleFromColor(themes[theme][color]);
            document.documentElement.style.setProperty(cssVar, styledColor);
        });
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
