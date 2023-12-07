import { Answer, CaaAnswer, CaaData, Packet, Question } from 'dns-packet';

const BASE_TTL = process.env.BASE_TTL ? Number(process.env.BASE_TTL) : 3600;

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

const handleATypeQuestion = (name: string): Answer[] => {
  const domainServerIp = process.env.DOMAIN_SERVER_IP;
  return domainServerIp ? [prepareAnswerForA(name, domainServerIp)] : [];
};

const handleNSTypeQuestion = (name: string): Answer[] => {
  return prepareAnswersForNS(name);
};

const handleCAATypeQuestion = (name: string): Answer[] => {
  const record = process.env.CAA_RECORD_1;
  if (record) {
    const caaData: CaaData = {
      tag: 'issue',
      value: record,
    };
    return [prepareAnswerForCAA(name, caaData)];
  }

  return [];
};

const prepareAnswerForA = (name: string, domainServerIp: string) => {
  return prepareAnswer(name, domainServerIp, 'A');
};

const prepareAnswersForNS = (name: string): Answer[] => {
  const answers: Answer[] = [];
  for (let i = 1; i <= 4; i += 1) {
    const nameServerEnv = process.env[`NAME_SERVER_${i}`];
    if (nameServerEnv) {
      answers.push(prepareAnswer(name, nameServerEnv, 'NS', BASE_TTL));
    }
  }
  return answers;
};

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
  ttl = BASE_TTL,
): Answer => {
  return {
    name,
    data,
    type,
    ttl,
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
