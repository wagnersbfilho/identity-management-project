// Verificação simplificada de VCs para SGI Trabalho 4
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
// Carregar chave pública do issuer
const issuerKeyPath = path.join(__dirname, '..', 'credentials', 'issuer-key.json');

let issuerPublicKey;
try {
    const issuerKey = JSON.parse(fs.readFileSync(issuerKeyPath, 'utf8'));
    issuerPublicKey = issuerKey.publicKey;
} catch (e) {
    console.error('Aviso: Não foi possível carregar chave do issuer');
}
/**
 * Verificar uma Verifiable Credential
 * Verificação simplificada para fins educacionais
 */
function verifyCredential(credential) {
    const result = {
        verified: false,
        error: null,
        credential: null
    };
    try {
        // 1. Verificar campos obrigatórios
        if (!credential['@context'] || !credential.type || !credential.issuer ||
            !credential.credentialSubject || !credential.proof) {
            result.error = 'Campos obrigatórios em falta';
            return result;
        }
        // 2. Verificar tipo de credencial
        if (!credential.type.includes('VerifiableCredential')) {
            result.error = 'Não é uma VerifiableCredential válida';
            return result;
        }
        // 3. Verificar expiração
        if (credential.expirationDate) {
            const expDate = new Date(credential.expirationDate);
            if (expDate < new Date()) {
                result.error = 'A credencial expirou';
                return result;
            }
        }
        // 4. Verificar assinatura (simplificado)
        // Em produção, usaria verificação criptográfica adequada
        const proof = credential.proof;
        if (!proof.proofValue) {
            result.error = 'Valor da oova em falta';
            return result;
        }

        // Para este trabalho, verificamos usando uma abordagem simplificada
        // que verifica se a prova foi criada pelo issuer esperado

        const expectedIssuer = typeof credential.issuer === 'string'
            ? credential.issuer
            : credential.issuer.id;

        if(!proof.verificationMethod.startsWith(expectedIssuer)){
            result.error= 'Método de verificação da prova não corresponde ao issuer';
            return result;
        }

        //Numa implementação real, você faria:
        //-Resolver o DID do issuer para obter a chave pública
        //-Verificar aassinatura criptográfica
        //Par aeste trabalho,confiamos em credenciais assinadas pelo nosso issuer de teste

        result.verified = true;
        result.credential =credential;
    } catch(e){
        result.error =e.message;
    }
    return result;
}
/**
 *Extrair informação do utilizador de uma credencial verificada
 */
function extractUserInfo(credential){
    const subject = credential.credentialSubject;
    return {
        id: 'vc-' +(subject.id||'unknown').replace(/[^a-zA-Z0-9]/g, '-'),
        username: subject.email||subject.id,
        displayName: subject.name ||'UtilizadorVC',
        email:subject.email,
        vcIssuer: typeof credential.issuer === 'string'
            ? credential.issuer
            : credential.issuer.id,
        vcType: credential.type.filter(t=> t!== 'VerifiableCredential').join(','),
        authMethod:'vc'
    };
}
module.exports = {
    verifyCredential,
    extractUserInfo
};
