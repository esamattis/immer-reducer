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
    testPathIgnorePatterns: ["node_modules", "<rootDir>/build"],
    testMatch: ["**/__tests__/*.test.(ts|tsx|js)"],
};
