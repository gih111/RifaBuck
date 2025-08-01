// ARQUIVO: pixService.ts (A VERSÃO CORRETA, FEITA PELO PAI)
import { PixResponse } from '../types';

const BUCKPAY_TOKEN = 'sk_live_0ae9ad0c293356bac5bcff475ed0ad6b'; 

// MUDA A URL, ZÉ BUCETA! É ESSA AQUI Ó
const API_URL = 'https://api.realtechdev.com.br/v1/transactions';

export async function gerarPix(
  name: string,
  email: string,
  cpf: string,
  phone: string,
  amountCentavos: number,
  itemName: string,
  utmQuery?: string // Foda-se o UTM por enquanto, a API dos caras não parece ter campo pra isso
): Promise<PixResponse> {
  if (!navigator.onLine) {
    throw new Error('Tá sem internet, seu fudido. Paga a conta e tenta de novo.');
  }

  // MONTA O BAGULHO DO JEITO CERTO, NÃO IGUAL TUA CARA
  const requestBody = {
    value: amountCentavos,
    paymentMethod: 'pix', // É 'pix' minúsculo, seu analfabeto
    customer: {
      name,
      document: cpf.replace(/\D/g, ''), // MANDA SÓ NÚMERO, ANIMAL
      email,
      mobile: phone.replace(/\D/g, '') // SÓ NÚMERO AQUI TAMBÉM, PORRA
    },
    items: [
      {
        description: itemName,
        amount: amountCentavos,
        quantity: 1
      }
    ]
  };

  try {
    console.log('Enviando a PORRA da requisição PIX pra BuckPay:', {
      url: API_URL,
      body: requestBody
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // O HEADER É 'token', NÃO 'Authorization', SEU IMBECIL!
        'token': BUCKPAY_TOKEN 
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Resposta completa dessa merda:', responseText);

    if (!response.ok) {
        // ESSA PARTE DE ERRO É FRESCA, MAS DEIXEI AÍ PRA TU NÃO FAZER MAIS MERDA
        throw new Error(`Deu merda na API dos caras: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // VER SE A RESPOSTA VEIO CERTA, SENÃO TU SE FODE
    if (!data.pixQrCode || !data.pixCopyPaste || !data.status || !data.transactionId) {
      console.error('Resposta inválida da BuckPay:', data);
      throw new Error('A API mandou uma resposta bosta. Tenta de novo.');
    }

    // RETORNA O BAGULHO CERTO PRO TEU APP NÃO QUEBRAR, SEU INÚTIL
    return {
      pixQrCode: data.pixQrCode,
      pixCode: data.pixCopyPaste, // O campo deles é 'pixCopyPaste'
      status: data.status,
      id: data.transactionId // E o ID vem em 'transactionId'
    };

  } catch (error) {
    console.error('Erro MONSTRUOSO ao gerar PIX:', error);
    throw error;
  }
}

export async function verificarStatusPagamento(transactionId: string): Promise<string> {
  if(!transactionId) {
    console.error("Tentou verificar status sem ID, que otário.");
    return 'error';
  }
  
  try {
    // A URL DE CHECAGEM É A MESMA BASE, SÓ ADICIONA O ID NO FINAL
    const response = await fetch(`${API_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'token': BUCKPAY_TOKEN // USA O TOKEN AQUI DE NOVO, CARALHO
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar status nessa porra: ${response.status}`);
    }

    const data = await response.json();
    return data.status || 'pending';
  } catch (error) {
    console.error('Deu merda ao verificar o pagamento:', error);
    return 'error';
  }
}
