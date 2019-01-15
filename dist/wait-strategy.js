"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_duration_1 = require("node-duration");
const clock_1 = require("./clock");
const logger_1 = __importDefault(require("./logger"));
class AbstractWaitStrategy {
    constructor() {
        this.startupTimeout = new node_duration_1.Duration(10000, node_duration_1.TemporalUnit.MILLISECONDS);
    }
    withStartupTimeout(startupTimeout) {
        this.startupTimeout = startupTimeout;
        return this;
    }
}
class HostPortWaitStrategy extends AbstractWaitStrategy {
    constructor(dockerClient, hostPortCheck, internalPortCheck, clock = new clock_1.SystemClock()) {
        super();
        this.dockerClient = dockerClient;
        this.hostPortCheck = hostPortCheck;
        this.internalPortCheck = internalPortCheck;
        this.clock = clock;
    }
    waitUntilReady(containerState) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all([this.doHostPortCheck(containerState), this.doInternalPortCheck(containerState)]);
        });
    }
    doHostPortCheck(containerState) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = this.clock.getTime();
            const hostPorts = containerState.getHostPorts();
            let hostPortIndex = 0;
            while (hostPortIndex < hostPorts.length) {
                const hostPort = hostPorts[hostPortIndex];
                logger_1.default.info(`Waiting for host port :${hostPort}`);
                if (this.hasStartupTimeoutElapsed(startTime)) {
                    const timeout = this.startupTimeout.get(node_duration_1.TemporalUnit.MILLISECONDS);
                    throw new Error(`Port :${hostPort} not bound after ${timeout}ms`);
                }
                if (this.hostPortCheck.isBound(hostPort)) {
                    hostPortIndex++;
                }
                yield new Promise(resolve => setTimeout(resolve, 100));
            }
        });
    }
    doInternalPortCheck(containerState) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = this.clock.getTime();
            const internalPorts = containerState.getInternalPorts();
            let internalPortIndex = 0;
            while (internalPortIndex < internalPorts.length) {
                const internalPort = internalPorts[internalPortIndex];
                logger_1.default.info(`Waiting for internal port :${internalPort}`);
                if (this.hasStartupTimeoutElapsed(startTime)) {
                    const timeout = this.startupTimeout.get(node_duration_1.TemporalUnit.MILLISECONDS);
                    throw new Error(`Port :${internalPort} not bound after ${timeout}ms`);
                }
                if (this.internalPortCheck.isBound(internalPort)) {
                    internalPortIndex++;
                }
                yield new Promise(resolve => setTimeout(resolve, 100));
            }
        });
    }
    hasStartupTimeoutElapsed(startTime) {
        return this.clock.getTime() - startTime > this.startupTimeout.get(node_duration_1.TemporalUnit.MILLISECONDS);
    }
}
exports.HostPortWaitStrategy = HostPortWaitStrategy;