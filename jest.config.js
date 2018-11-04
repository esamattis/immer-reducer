module.exports = {
    moduleFileExtensions: ["ts", "tsx", "js"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    globals: {
        "ts-jest": {
            tsConfigFile: "tsconfig.json",
        },
    },
    testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
};
