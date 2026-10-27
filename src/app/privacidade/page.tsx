import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Política de Privacidade — Sistema de Disputa",
  description: "Como o Sistema de Disputa coleta, usa e protege dados pessoais, conforme a LGPD.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro={`Esta política explica quais dados pessoais o ${BUSINESS.brand} trata, para quê, com quem os compartilha e quais são os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018).`}
    >
      <LegalSection title="1. Quem é responsável pelos dados">
        <p>
          Há dois papéis. {BUSINESS.legalName ?? BUSINESS.operator}
          {BUSINESS.cnpj ? ` (CNPJ ${BUSINESS.cnpj})` : ""} é o <strong>controlador</strong> dos dados dos organizadores
          (quem cria conta e contrata o serviço). Já os dados de equipes e atletas de cada campeonato são tratados em
          nome do <strong>organizador</strong>, que decide quais dados coletar e para quê; nesse caso, atuamos como
          <strong> operador</strong>, fornecendo a ferramenta.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que tratamos">
        <ul>
          <li>
            <strong>Organizadores:</strong> nome, e-mail e senha (guardada apenas em formato criptografado, sem
            possibilidade de leitura), plano contratado e histórico de pagamentos da assinatura.
          </li>
          <li>
            <strong>Equipes:</strong> nome e logo da equipe, nome do responsável, telefone e e-mail de contato.
          </li>
          <li>
            <strong>Atletas:</strong> nome, número da camisa, posição, data de nascimento e CPF (quando o organizador
            usa o cadastro de atletas), além de gols, cartões e demais estatísticas de jogo.
          </li>
          <li>
            <strong>Pagamentos por PIX:</strong> valor, identificador e situação da cobrança. Dados bancários completos
            ficam com a instituição de pagamento, não conosco.
          </li>
          <li>
            <strong>Assistente virtual:</strong> as mensagens enviadas ao assistente e, se você informar, seus dados de
            contato.
          </li>
          <li>
            <strong>Dados técnicos:</strong> registros de acesso e de erros necessários para segurança e funcionamento.
          </li>
        </ul>
        <p>
          Nas páginas públicas de cada campeonato aparecem nome da equipe, nome e número dos atletas e as estatísticas
          esportivas. CPF e data de nascimento não são exibidos publicamente.
        </p>
      </LegalSection>

      <LegalSection title="3. Para que usamos">
        <ul>
          <li>Criar e manter a conta e prestar o serviço contratado (inscrições, chaveamento, súmulas, estatísticas).</li>
          <li>Processar pagamentos e emitir comprovantes.</li>
          <li>Enviar e-mails do serviço, como a redefinição de senha.</li>
          <li>Responder dúvidas e melhorar o atendimento.</li>
          <li>Garantir a segurança do sistema e cumprir obrigações legais.</li>
        </ul>
        <p>
          As bases legais são principalmente a execução do contrato, o cumprimento de obrigação legal e o legítimo
          interesse; quando necessário, usamos o consentimento.
        </p>
      </LegalSection>

      <LegalSection title="4. Atletas menores de idade">
        <p>
          Muitos campeonatos têm participantes com menos de 18 anos, como os escolares. Os dados de crianças e
          adolescentes são tratados no melhor interesse deles. A LGPD exige o consentimento específico de ao menos um
          dos pais ou do responsável legal, e é o <strong>organizador</strong> quem deve obtê-lo antes de cadastrar o
          atleta. Ao enviar uma inscrição, quem a envia declara ter essa autorização.
        </p>
      </LegalSection>

      <LegalSection title="5. Com quem compartilhamos">
        <p>Não vendemos dados pessoais. Usamos prestadores de serviço para operar o sistema:</p>
        <ul>
          <li>Hospedagem da aplicação e arquivos (Vercel).</li>
          <li>Banco de dados (Supabase).</li>
          <li>Envio de e-mails (Resend).</li>
          <li>Cobranças por PIX (Efí) e, na venda de assinaturas, a plataforma de vendas utilizada (por exemplo, Hotmart).</li>
          <li>Assistente virtual, que usa inteligência artificial da Anthropic para gerar as respostas.</li>
        </ul>
        <p>
          Alguns desses prestadores ficam fora do Brasil, o que caracteriza transferência internacional de dados, feita
          com base em contrato e em medidas de segurança adequadas. Também podemos compartilhar dados por ordem de
          autoridade competente.
        </p>
      </LegalSection>

      <LegalSection title="6. Por quanto tempo guardamos">
        <p>
          Mantemos os dados enquanto a conta estiver ativa e pelo tempo necessário para cumprir obrigações legais e
          resolver disputas. O organizador pode excluir equipes e campeonatos; pedidos de exclusão de conta ou de dados
          podem ser feitos pelo contato abaixo.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos">
        <p>Você pode pedir, a qualquer momento:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos ou desatualizados;</li>
          <li>anonimização, bloqueio ou exclusão de dados desnecessários ou tratados em desacordo com a lei;</li>
          <li>portabilidade, informação sobre compartilhamentos e revogação do consentimento.</li>
        </ul>
        <p>
          Se o seu dado foi cadastrado por um organizador (por exemplo, você é atleta de um campeonato), o pedido
          também pode ser feito diretamente a ele, e nós ajudamos a atendê-lo.
        </p>
      </LegalSection>

      <LegalSection title="8. Segurança">
        <p>
          Senhas são guardadas de forma criptografada, o acesso ao sistema usa conexão segura (HTTPS) e cada
          organizador só acessa os dados dos próprios campeonatos. Nenhum sistema é totalmente imune a falhas; em caso
          de incidente relevante, avisaremos os afetados e a autoridade competente conforme a lei.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Usamos apenas o cookie essencial de sessão, que mantém você conectado na área do organizador. Não usamos
          cookies de publicidade nem de rastreamento de terceiros.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações e contato">
        <p>
          Podemos atualizar esta política e avisaremos sobre mudanças relevantes. Veja também os{" "}
          <Link href="/termos" className="underline">Termos de Uso</Link>.
        </p>
        <p>
          {BUSINESS.contactEmail ? (
            <>
              Para exercer seus direitos ou tirar dúvidas sobre dados pessoais: <a href={`mailto:${BUSINESS.contactEmail}`} className="underline">{BUSINESS.contactEmail}</a>.
            </>
          ) : (
            <>Para exercer seus direitos ou tirar dúvidas sobre dados pessoais, fale com a gente pelo assistente do sistema.</>
          )}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
