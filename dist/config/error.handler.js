"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = handleError;
const library_1 = require("@prisma/client/runtime/library");
function handleError(error) {
    if (error instanceof library_1.PrismaClientKnownRequestError) {
        console.error(`Erro [${error.code}]: ${error.message}`);
        return null;
    }
    console.log(error);
    return null;
}
