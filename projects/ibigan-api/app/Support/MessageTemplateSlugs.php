<?php

declare(strict_types=1);

namespace App\Support;

final class MessageTemplateSlugs
{
    public const REPORT_COMPLETED = 'relatorio-pronto';

    public const USER_INVITE = 'convite-usuario';

    public const USER_CREATED = 'usuario-criado';

    public const USER_PENDING_APPROVAL = 'usuario-aguardando-aprovacao';

    public const USER_APPROVED = 'usuario-aprovado';

    public const USER_REJECTED = 'usuario-rejeitado';

    public const PASSWORD_RESET = 'redefinicao-de-senha';

    public const TWO_FACTOR_CODE = 'codigo-verificacao-2fa';
}
