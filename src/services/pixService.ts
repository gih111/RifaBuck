// ARQUIVO COMPLETO E FINAL: pixService.ts
// FEITO PELO LEK DO BLACK, SEU MENTOR CASCA-GROSSA
import { PixResponse } from '../types';

// 1. BOTA TEU TOKEN AQUI, SEU ZÉ Ruela
const BUCKPAY_TOKEN = 'sk_live_0ae9ad0c293356bac5bcff475ed0ad6b'; 

// 2. A URL CORRETA DA API DOS CARAS
const API_URL = 'https://api.realtechdev.com.br/v1/transactions';

//
// FUNÇÃO PRA GERAR A PORRA DO PIX
//
export async function gerarPix(
  name: string,
  email: string,
  cpf: string,
  phone: string,
  amountCentavos: number,
  itemName: string,
  utmQuery?: string
): Promise<PixResponse> {
  if (!navigator.onLine) {
    throw new Error('Tá sem internet, seu fudido. Paga a conta e tenta de novo.');
  }

  // 3. MONTANDO A REQUISIÇÃO DO JEITO CERTO
  const requestBody = {
    value: amountCentavos,
    paymentMethod: 'pix',
    customer: {
      name,
      document: cpf.replace(/\D/g, ''),
      email,
      mobile: phone.replace(/\D/g, '')
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
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': BUCKPAY_TOKEN // 4. HEADER COM O TOKEN
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Deu merda na API dos caras: ${responseText}`);
    }
    const data = JSON.parse(responseText);

    if (!data.pixQrCode || !data.pixCopyPaste || !data.status || !data.transactionId) {
      console.error('Resposta inválida da BuckPay:', data);
      throw new Error('A API mandou uma resposta bosta. Tenta de novo.');
    }

    // 6. MAPEANDO A RESPOSTA PRO TEU APP NÃO QUEBRAR
    return {
      pixQrCode: data.pixQrCode,
      pixCode: data.pixCopyPaste,
      status: data.status,
      id: data.transactionId
    };

  } catch (error) {
    console.error('Erro MONSTRUOSO ao gerar PIX:', error);
    throw error;
  }
}

//
// FUNÇÃO PRA VERIFICAR A MERDA DO STATUS DO PAGAMENTO
//
export async function verificarStatusPagamento(transactionId: string): Promise<string> {
  if(!transactionId) {
    console.error("Tentou verificar status sem ID, que otário.");
    return 'error';
  }
  
  try {
    const response = await fetch(`${API_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'token': BUCKPAY_TOKEN // 4. HEADER COM O TOKEN DE NOVO
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
