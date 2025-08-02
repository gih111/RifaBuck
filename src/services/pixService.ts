// ARQUIVO CORRIGIDO CONFORME DOCUMENTAÇÃO BUCKPAY
import { PixResponse } from '../types';

// Token da BuckPay
const BUCKPAY_TOKEN = 'sk_live_0ae9ad0c293356bac5bcff475ed0ad6b'; 

// URL base da API - usando proxy do Vite em desenvolvimento
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'https://api.realtechdev.com.br';
const API_URL = `${API_BASE_URL}/v1/transactions`;

//
// FUNÇÃO PARA GERAR PIX CONFORME DOCUMENTAÇÃO
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
    throw new Error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
  }

  // Estrutura conforme documentação BuckPay
  const requestBody = {
    value: amountCentavos, // Valor em centavos
    paymentMethod: 'pix',
    customer: {
      name: name,
      document: cpf.replace(/\D/g, ''), // Remove formatação do CPF
      email: email,
      mobile: phone.replace(/\D/g, '') // Remove formatação do telefone
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
        'Authorization': `Bearer ${BUCKPAY_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API BuckPay:', errorText);
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Resposta da BuckPay:', data);

    // Verificar se a resposta contém os campos necessários
    if (!data.pixQrCode || !data.pixCopyPaste || !data.transactionId) {
      console.error('Resposta inválida da BuckPay:', data);
      throw new Error('Resposta inválida da API. Tente novamente.');
    }

    // Mapear resposta conforme interface
    return {
      pixQrCode: data.pixQrCode,
      pixCode: data.pixCopyPaste,
      status: data.status || 'pending',
      id: data.transactionId
    };

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }
    throw error;
  }
}

//
// FUNÇÃO PARA VERIFICAR STATUS DO PAGAMENTO
//
export async function verificarStatusPagamento(transactionId: string): Promise<string> {
  if (!transactionId) {
    console.error('ID da transação não fornecido');
    return 'error';
  }
  
  try {
    const response = await fetch(`${API_URL}/${transactionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${BUCKPAY_TOKEN}`
      }
    }
    )

    if (!response.ok) {
      console.error(`Erro ao verificar status: ${response.status}`);
      return 'error';
    }

    const data = await response.json();
    return data.status || 'pending';
    
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return 'error';
  }
}