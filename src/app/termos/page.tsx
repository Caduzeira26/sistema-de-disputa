import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Termos de Uso — Sistema de Disputa",
  description: "Regras de uso do Sistema de Disputa, plataforma de gestão de torneios esportivos.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro={`Estes termos regulam o uso do ${BUSINESS.brand}, plataforma de gestão de torneios esportivos operada por ${
        BUSINESS.legalName ?? BUSINESS.operator
      }${BUSINESS.cnpj ? ` (CNPJ ${BUSINESS.cnpj})` : ""}. Ao criar uma conta ou usar o serviço, você declara ter lido e concordado com eles.`}
    >
      <LegalSection title="1. O serviço">
        <p>
          O {BUSINESS.brand} permite que organizadores criem campeonatos, recebam inscrições de equipes, realizem o
          sorteio, gerem o chaveamento, registrem resultados e súmulas, e divulguem tabelas e estatísticas em uma página
          pública. Os recursos disponíveis dependem do plano contratado.
        </p>
      </LegalSection>

      <LegalSection title="2. Conta do organizador">
        <ul>
          <li>Para criar campeonatos é necessário ter conta, com nome, e-mail e senha.</li>
          <li>É preciso ser maior de 18 anos ou representar uma instituição (escola, clube, empresa) que o autorize.</li>
          <li>Você é responsável por manter a senha em sigilo e por tudo o que for feito com a sua conta.</li>
          <li>Informe dados verdadeiros e mantenha-os atualizados.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Planos, teste grátis e pagamento">
        <p>
          Os planos, preços e limites estão em <Link href="/planos" className="underline">/planos</Link>. O primeiro
          campeonato pode ser criado no teste grátis, sem cobrança, dentro dos limites informados na página de planos.
        </p>
        <ul>
          <li>As assinaturas são cobradas pelos meios de pagamento exibidos no momento da contratação.</li>
          <li>Ao fim do período pago, os recursos do plano deixam de estar disponíveis caso a assinatura não seja renovada.</li>
          <li>Podemos alterar preços e planos; a mudança vale para os próximos períodos e será informada com antecedência.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cancelamento e reembolso">
        <p>
          Você pode cancelar a assinatura a qualquer momento e continua com acesso até o fim do período já pago. Nas
          contratações feitas pela internet, vale o direito de arrependimento de 7 dias corridos a partir da compra
          (art. 49 do Código de Defesa do Consumidor), com devolução integral do valor pago. O pedido de reembolso deve
          ser feito pela plataforma de venda em que a compra foi realizada ou pelo nosso contato.
        </p>
      </LegalSection>

      <LegalSection title="5. Inscrições pagas por PIX">
        <p>
          Nos planos que permitem cobrar inscrição, o organizador define o valor e o pagamento é feito por PIX pelas
          equipes. A taxa por inscrição paga e as regras de repasse são as informadas na página de planos. O organizador
          é o responsável perante as equipes pelo campeonato, pelo regulamento e por eventuais devoluções de inscrição.
        </p>
      </LegalSection>

      <LegalSection title="6. Dados de atletas e equipes">
        <p>
          O organizador decide quais dados de equipes e atletas coletar e é o responsável por tratá-los de acordo com a
          Lei Geral de Proteção de Dados (LGPD). Isso inclui obter a autorização do responsável legal antes de cadastrar
          atletas menores de 18 anos e informar os participantes sobre o uso dos dados. Veja a{" "}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </LegalSection>

      <LegalSection title="7. Uso permitido">
        <p>É proibido usar o serviço para:</p>
        <ul>
          <li>atividades ilegais, fraudulentas ou que violem direitos de terceiros;</li>
          <li>publicar conteúdo ofensivo, discriminatório ou que exponha indevidamente dados de pessoas;</li>
          <li>tentar acessar contas ou dados de outros organizadores, ou comprometer a segurança do sistema;</li>
          <li>revender ou sublicenciar o acesso sem autorização por escrito.</li>
        </ul>
        <p>O descumprimento pode levar à suspensão ou ao encerramento da conta.</p>
      </LegalSection>

      <LegalSection title="8. Assistente virtual">
        <p>
          O assistente do sistema responde dúvidas de forma automática, com apoio de inteligência artificial. As
          respostas podem conter erros e não substituem o regulamento do seu campeonato nem orientação profissional.
          As conversas são guardadas para melhorarmos o atendimento, conforme a Política de Privacidade.
        </p>
      </LegalSection>

      <LegalSection title="9. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter o serviço disponível, mas ele pode ficar indisponível por manutenção, falhas de
          terceiros (hospedagem, banco de dados, e-mail, pagamentos) ou outras causas fora do nosso controle. Não
          garantimos funcionamento ininterrupto. Recomendamos que o organizador mantenha uma cópia dos dados que forem
          essenciais ao campeonato. Na medida permitida em lei, nossa responsabilidade se limita ao valor pago pelo
          organizador nos 12 meses anteriores ao fato, sem prejuízo dos direitos do consumidor.
        </p>
      </LegalSection>

      <LegalSection title="10. Propriedade intelectual">
        <p>
          O sistema, sua marca e seu código pertencem a {BUSINESS.operator}. O organizador mantém a titularidade das
          logos, nomes e dados que cadastra e nos autoriza a exibi-los no serviço para o funcionamento do campeonato.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações destes termos">
        <p>
          Podemos atualizar estes termos. Mudanças relevantes serão comunicadas pelo sistema ou por e-mail. Continuar
          usando o serviço após a atualização significa que você concorda com a nova versão.
        </p>
      </LegalSection>

      <LegalSection title="12. Lei aplicável e contato">
        <p>
          Estes termos seguem as leis do Brasil. Fica eleito o foro do domicílio do consumidor para resolver qualquer
          disputa.
        </p>
        <p>
          {BUSINESS.contactEmail ? (
            <>
              Dúvidas, pedidos de reembolso ou reclamações: <a href={`mailto:${BUSINESS.contactEmail}`} className="underline">{BUSINESS.contactEmail}</a>.
            </>
          ) : (
            <>Dúvidas, pedidos de reembolso ou reclamações: fale com a gente pelo assistente do sistema.</>
          )}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
