import { Answer, CaaAnswer, CaaData, Packet, Question } from 'dns-packet';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const BASE_TTL = process.env.BASE_TTL ? Number(process.env.BASE_TTL) : 3600;
const DOMAIN_SERVER_IP = process.env.DOMAIN_SERVER_IP;
const CAA_RECORD_1 = process.env.CAA_RECORD_1;
const NAME_SERVERS: string[] = getNameServersFromEnvironmentVariables();

export const handleDnsQuery = (req: Packet): Packet | null => {
  const answers: Answer[] | null = getAnswers(req);
  if (!answers) return null;

  return formResponsePacket(req, answers);
};

const getAnswers = (req: Packet): Answer[] | null => {
  if (!req?.questions?.length) {
    return null;
  }

  const [question] = req.questions;
  return handleQuestion(question);
};

const handleQuestion = (question: Question): Answer[] => {
  const { name, type } = question;

  switch (type) {
    case 'A':
      return handleATypeQuestion(name);
    case 'NS':
      return handleNSTypeQuestion(name);
    case 'CAA':
      return handleCAATypeQuestion(name);
    default:
      return [];
  }
};

const handleATypeQuestion = (name: string): Answer[] =>
  DOMAIN_SERVER_IP ? [prepareAnswerForA(name, DOMAIN_SERVER_IP)] : [];

const handleNSTypeQuestion = (name: string): Answer[] =>
  NAME_SERVERS.map((ns) => prepareAnswer(name, ns, 'NS'));

const handleCAATypeQuestion = (name: string): Answer[] => {
  if (CAA_RECORD_1) {
    const caaData: CaaData = {
      tag: 'issue',
      value: CAA_RECORD_1,
    };
    return [prepareAnswerForCAA(name, caaData)];
  }

  return [];
};

const prepareAnswerForA = (name: string, domainServerIp: string) =>
  prepareAnswer(name, domainServerIp, 'A');

const formResponsePacket = (req: Packet, answers: Answer[]): Packet => {
  return {
    ...req,
    type: 'response',
    additionals: undefined,
    answers,
  };
};

const prepareAnswer = (
  name: string,
  data: string,
  type: 'A' | 'NS',
): Answer => {
  return {
    name,
    data,
    type,
    ttl: BASE_TTL,
    class: 'IN',
    flush: false,
  };
};

const prepareAnswerForCAA = (name: string, data: CaaData): CaaAnswer => {
  return {
    name,
    data,
    type: 'CAA',
    ttl: BASE_TTL,
    class: 'IN',
    flush: false,
  };
};

function getNameServersFromEnvironmentVariables(): string[] {
  const NUMBER_OF_NAME_SERVERS = 4;
  const NAME_SERVER_ERROR_MESSAGE =
    'Required environment variables NAME_SERVER_1, NAME_SERVER_2, NAME_SERVER_3, NAME_SERVER_4 are not set';

  const nameServers = Array.from(
    { length: NUMBER_OF_NAME_SERVERS },
    (_, i) => process.env[`NAME_SERVER_${i + 1}`] || '',
  ).filter(Boolean);

  if (!nameServers.length) {
    throw new Error(NAME_SERVER_ERROR_MESSAGE);
  }

  return nameServers;
}
