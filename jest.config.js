module.exports = {
    moduleFileExtensions: ["ts", "tsx", "js"],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
    },
    globals: {
        "ts-jest": {
            tsConfig: "tsconfig.json",
        },
    },
    testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
};
