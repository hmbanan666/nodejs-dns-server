import { Answer, Packet } from 'dns-packet';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const handleQuery = (req: Packet): Packet | null => {
  if (!req?.questions?.length) {
    return null;
  }

  const [question] = req.questions;
  const { name, type } = question;

  const answers: Answer[] = [];

  if (type === 'A') {
    const data = process.env.DOMAIN_SERVER_IP;
    if (data) {
      answers.push(prepareAnswer(name, data, 'A'));
    }
  }

  if (type === 'NS') {
    if (process.env.NAME_SERVER_1) {
      answers.push(prepareAnswer(name, process.env.NAME_SERVER_1, 'NS', 21600));
    }
    if (process.env.NAME_SERVER_2) {
      answers.push(prepareAnswer(name, process.env.NAME_SERVER_2, 'NS', 21600));
    }
    if (process.env.NAME_SERVER_3) {
      answers.push(prepareAnswer(name, process.env.NAME_SERVER_3, 'NS', 21600));
    }
    if (process.env.NAME_SERVER_4) {
      answers.push(prepareAnswer(name, process.env.NAME_SERVER_4, 'NS', 21600));
    }
  }

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
  ttl = 3600,
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
