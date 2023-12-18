本稿は[Angular Advent Calendar 2023](https://qiita.com/advent-calendar/2023/angular) 20日目の記事です。
19日目の記事は[@sosukesuzuki](https://qiita.com/sosukesuzuki)さんの[]()でした。

# ２年前の自分に送る！べからず集

筆者がエンジニアに転職し、Angularを始めてはや2年と少しが経過。  
プロダクトも初期段階＆フロントエンドをリードするメンバー不在の中、暗中模索の毎日でした。  
「このク〇コードは誰が書いたn……自分やわ」という羞恥と懺悔にまみれながら、少しでも良いコードを書こうと思考と試行を重ねる日々。  
そんな過去の反省から、なかでもコンポーネントの書き方についてみえてきた指針がいくつかあります。  
年末の禊もかねて、2年前の自分に伝えたい「べからず（ではどうすべきか）」集を公開します。  

:::message slert
おことわり
この記事は筆者の短いエンジニア歴からひねり出した「こうしたほうがええんちゃう？」集です。人によって考え方は様々ですし、筆者自身さらに経験を重ねれば意見が変わっていくこともあるでしょう。寛大にみていただければ幸いです。
:::

## この記事で登場するサンプルアプリケーション
v17のキャッチアップがてら、説明用に「クリスマスに食べたいメニュー」を投票するサンプルアプリを作りました。機能は以下のとおりです。
- 食べたいメニュー登録（メニュー名、推薦文、投稿者を入力）
- 登録されたメニュー一覧表示
- 食べたいメニューに投票
- メニュー削除

<!-- 画像入れる -->
- 一覧画面
- 登録画面（ダイアログ）
- 登録画面（ダイアログ）

なお、簡便のため登録されたメニューはストアに保持しているだけです。ブラウザリロード等で

:::message
- 補足1)  v17の機能を試したかったため、実験的に
    - フォームの値の受け渡しに[Signals](https://angular.dev/guide/signals)を使用していますが、従来のReactive Formsの方が使いやすいかもしれません（要件によるでしょう）
    - テンプレートの分岐・繰り返しに[Control Flow](https://angular.dev/guide/templates/control-flow)を使用しています
    - @Inputに[required](https://angular.dev/guide/components/inputs#required-inputs)を指定しています
- 補足2) Standaloneベースで書きます（もうこっちが基本でいいよね？）
- 補足3) 実装を簡単にするため、[Angular Material](https://material.angular.io/)を使用しています。<mat->から始まる要素はMaterialのコンポーネントです
:::

## Observableを購読したままにしない！
これはRxJSを採用しているプロジェクトならやりがち大定番ですね。でも知らないと大量発生する厄介者です。  
**Observableは購読（subscribe）したあと何もせず放置しておくとメモリに残り続け、メモリリークの原因になります。**
そのため、購読した後に解除の処理を入れてやる必要があります。  
でもこれって知らないと対処しないですよね。筆者が関わるプロダクトでも既存のコードに解除の処理はありませんでした。後になって購読解除の必要性を知り、購読解除を入れる修正をしまくった苦い経験があります。  

### 購読解除しよう
主に2つの方法があります。
1. 明示的にunsubscribeする
2. [takeUntilオペレータ](https://rxjs-dev.firebaseapp.com/api/index/function/takeUntil)を挟みこむ

まずは1から。ObservableをsubscribeするとSubscriptionが返されるので、解除用のプロパティに突っ込んでunsubscribeする方法。
```typescript
  private subscription!: Subscription

  onAdd() {
    const input: AddMenuInput = {
      name: this.name(),
      recommendation: this.recommendation(),
      createdBy: this.createdBy(),
    }
    this.subscription = this.menuService.add(input)
    .subscribe(() => {
      this.added.emit()
    })
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }
```

次に2の方法。まとめて脳死で対応できるため、普段はこちらを採用しています。
- 購読解除用のSubjectを用意
- 各Observableのpipeの中でtakeUntilオペレータを挟みこむ
- 購読解除用のSubjectをnextすることで、まとめて購読解除

```typescript
  private readonly onDestory$ = new Subject<void>()

  onAdd() {
    const input: AddMenuInput = {
      name: this.name(),
      recommendation: this.recommendation(),
      createdBy: this.createdBy(),
    }
    this.menuService.add(input)
    .pipe(takeUntil(this.onDestory$))
    .subscribe(() => {
      this.added.emit()
    })
  }

  ngOnDestroy(): void {
    this.onDestory$.next()
  }
```

### 今後はもっと購読解除が楽になりそう？
上で紹介した方法は必要とはいえ、ボイラープレートが増えてめんどくさいですよね。
それをより楽にすべく、Angular v16から導入されたSignals関連のAPIに[takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)オペレータがあります。  
SignalsがまだDevelopper Previewのためプロダクトでは試せていませんが、[takeUntilDestroyedを紹介した記事](https://netbasal.com/getting-to-know-the-takeuntildestroyed-operator-in-angular-d965b7263856)によると、コンポーネントのngOnDestroyで書く処理を省略できる他、サービスやディレクティブでもお手軽に購読解除できるようです。  
とはいえ、injection context（constructorやプロパティ）以外での使用は[DestroyRef](https://angular.dev/api/core/DestroyRef)を挟み込まないといけないので、減る手間はngOnDestoryを書かなくてよいことぐらいか。  

```typescript
  private readonly destroyRef = inject(DestroyRef)

  onAdd() {
    const input: AddMenuInput = {
      name: this.name(),
      recommendation: this.recommendation(),
      createdBy: this.createdBy(),
    }
    this.menuService.add(input)
    // injection contextであればdestroyRefは不要
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.added.emit()
    })
  }
``` 

仕様が確定したらこっちに切り替えていきたいですね！ 


## is～プロパティ（状態フラグ）を増やさない！
コンポーネントに限らずですが、状態を手っ取り早く表現するために、`is～`（例：isOpened（開いているかどうか））プロパティを生やしがちです。そのコンポーネントの要件が変わらず、絶対にtrue/falseの2つの状態で表現できるなら採用してもよいでしょう。  
しかしこの世は諸行無常、要件は変わっていくものです。今回のメニューアプリで考えてみましょう。  
現在、メニューの登録はできますが編集機能がありません。これではメニュー名を間違えていたので直したいとなったとき、削除して登録しなおす必要があるため、それまでの投票数が消えてしまいますね。不足を補うべく、編集機能を追加しましょう。編集の場合の要件を以下とします。
- 登録済みのデータを取得して各フォームにセットする
- 投稿者フォームは変更不可（disabled）にする

さて、UI自体はほとんど変わらないため、登録で使用したコンポーネントを再利用すべく`isEdit`プロパティを追加しました。isEditがtrueの場合のロジックを追加します。たとえば2つ目の変更不可要件を達成しましょう。

```typescript
// component.ts
export class FormsComponent {
  isEdit: boolean = fales
  
  // 処理が続く…
}

// component.html（抜粋）
  <mat-form-field color="accent">
    <mat-label>誰が登録した？</mat-label>
    <mat-select
      [value]="createdBy()"
      (selectionChange)="createdBy.set($event.value)"
      // 追加
      [disabled]="isEdit"
    >
      @for (family of families; track $index) {
        <mat-option [value]="family">{{ family }}</mat-option>
      }
    </mat-select>
  </mat-form-field>
```

ここまではよさそうです。  
ときは少し流れて、新たな要求として「**投稿者以外が編集できると困るので、詳細を確認できるだけの画面がほしい**」となりました。画面を新たに用意すると工数がかかるため、さらにコンポーネントを流用してフォームをすべて変更不可（readonlyまたはdisabled）にすることで対応すべく、`isDetail`プロパティを生やしましょう。

```typescript
// component.ts
export class FormsComponent {
  @Input()
  isEdit: boolean = false
  
  @Input()
  isDetail: boolean = false
  
  // 処理が続く…
}

// component.html（抜粋）
  <mat-form-field color="accent">
    <mat-label>誰が登録した？</mat-label>
    <mat-select
      [value]="createdBy()"
      (selectionChange)="createdBy.set($event.value)"
      // 追加
      [disabled]="isEdit || isDetail"
    >
      @for (family of families; track $index) {
        <mat-option [value]="family">{{ family }}</mat-option>
      }
    </mat-select>
  </mat-form-field>
```

臭くなってきましたね。さらに要件が増えて、メニューに採用済み（`isAdopted`）の状態が増えた場合は…？  
状態フラグは1つで2つの値（状態）を持ちます。フラグが2つに増えたら`2 * 2 = 4つの状態`、3つに増えたら`2 * 2 * 2 = 8つの状態`を考慮しなくてはなりません。指数関数的に増えていきます。最悪です。保守したくありませんね。  
ここで強調しておきたいのは、**状態フラグを使うな**ということではありません。要件の見通しがたつシンプルなコンポーネントであれば、状態フラグで十分なこともあります。
**邪悪なのは「要件を整理せず」に「とりあえず」状態フラグを使用してしまう**ことです。特にあとから変更でフラグを加えていくのはスパゲティコードを生み出す原因です（過去の自分への戒め）

### 状態を型と値で表現しよう
ではどうすべきか。TypeScriptには便利な機能があるじゃないですか。さきほどの要件の状態を表現してみましょう。

```typescript
export type MenuFormState = 'ADD' | 'EDIT' | 'DETAIL' | 'ADOPTED'

export class FormsComponent {
  @Input()
  state: MenuFormState = 'ADD'
  
  // 処理が続く…
}
```

そうです、ユニオン型です。これで状態を4つの型（値）で表現することができました。それどころか、受け取るプロパティも1つになりました。状態が追加された場合も、ユニオン型に追加するだけで済みます。追加のロジックもその型に応じたものを実装するだけです。はるかに保守しやすくなります。  
一見複雑にみえる要件も、整理してあげれば**状態を区分けして命名する**ことが大抵の場合可能です。さらに踏み込んだ話をすると、状態を区分けすることで、その状態間の遷移にルールを設けることだってできます。  
コンポーネントを設計する際は、**要件からいくつの状態に区分けできるのか、その状態遷移に制約（条件、ルール）があるのか**を意識すると、少しハッピーになれるかもしれません。

### 状態ごとにコンポーネントを分けよう
別の手段として、コンポーネントを分けてしまう手もあります。薄いコンポーネントなら1つの中に複数の状態を持っても気になりませんが、複雑なコンポーネントの場合は既存のコードを読むだけで大変です。  
この場合は潔く**状態ごとに別のコンポーネントを作ってしまいましょう**。工数はかかりますが、単体のコンポーネントの保守はやりやすいため、トータルでみるとこっちの方がコストが低いかもしれません。状態ごとに共通する部品があるなら、共通コンポーネントを作ってあげればよいでしょう。  

どの手段をとるか悩ましいですが、設計の楽しい部分でもあり、開発者の腕の見せ所でもありますね！


## 「とりあえず」プロパティを増やすのはやめよう！
先の状態フラグと似た話ですが、プロパティを増やすと、コンポーネントはそれだけ複雑になっていきます。プロパティとは**つまり状態**です。状態を増やせば増やすほど、扱いが大変になります。
特にそれが変更可能な（readonly修飾子がない）場合顕著です。そのプロパティが**いつ・どこで変更されるのか**、コードを読む間いつも気にかけてなくてはなりません。メソッドのなかでそれらプロパティを参照している場合、**メソッドの実行結果の一貫性を保証できません**。プロパティが変われば結果も変わり得るからです。結果を読み解くのが大変になります。  
プロパティを増やしそうになったとき、以下を心の中で問いかけましょう。
- そのプロパティ、状態の一時置き場ではないか？
- 関数の引数・戻り値にできないか？
- readonlyにできないか？
- 複数のプロパティは1つにまとめられないか

変更可能なプロティが増えてきたなら、それはきっと**データフローと関心を整理できていない**兆候です。


### データフローと表示タイミングを洗い出す
### 表示するタイミングが同じものはまとめる

## 表示する側と中身を一緒にしない！
「表示する側」とは、遷移して表示する**ページ**や何かの操作によって開く**ダイアログ**等を指します。表示する「媒体」と呼んでもいいでしょう。これらを一緒にすると何がマズいのでしょうか？
- **中身を再利用できない**
- **同じ媒体でも表示する（呼び出される）か所によって、処理や与えたいデータが異なる可能性がある**

ことが理由です。サンプルアプリで考えてみましょう。  
先に示したように、今回はメニュー登録UIをダイアログで実装しました。しかし、スマートフォンのブラウザではダイアログの操作性がよくないため、スマートフォン用に登録UIをページで表示することにしました。このとき、側と中身のコンポーネントを分けておかないと、同じような中身を含んだコンポーネントをもう一つ量産することになります。これだと**登録ロジックや登録データに変更があった際、2か所ともに修正を加えなくてはなりません**。保守がめんどくさいですね。

```typescript
export class AddDialogComponent {
  // フォームのプロパティ
  // 登録処理
}

export class AddPageComponent {
  // ここにもフォームのプロパティ
  // ここにも登録処理
}
```

他にも、同じページでも遷移元が異なれば、**登録処理完了後の遷移先が異なる可能性もあります**。分岐処理を書けば済む話かもしれませんが、バッドスメルが立ち込めていませんか？他にもページを表示するか所が増えたら？分岐処理の中身が複雑でコードの見通しが悪くならない？…ならないと言い切れるなら、側と中身を一緒にしてもいいかもしれません。

```typescript
export class AddPageComponent {
  onAdd() {
    const input: AddMenuInput = {
      name: this.name(),
      recommendation: this.recommendation(),
      createdBy: this.createdBy(),
    }
    this.menuService.add(input)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      if (遷移元が○○ページなら) {
        // ○○ページへ遷移
      } else if (遷移元がxxページなら) {
        // xxページへ遷移
      } else {
        // TOPページへ遷移
      }
      // さらに増える可能性…？？
    })
  }
}
```

### 側と中身はコンポーネントを分けよう
**始めから分けて作りましょう**。これに尽きます。[Atomic Deasign](https://zenn.dev/hikary/articles/41b5f9747fe83f)までいくとやり過ぎ感ありますが、関心の見極めと分離は大切です。  
中身のコンポーネントは中身の処理に集中し、側のコンポーネントは表示媒体を司り、表示前後のコントロールを担うべきです。中身は同じでも、表示場所が変わる・増える、表示媒体が変わることは往々にしてあります。

```typescript
export class AddComponent {
  // 処理（の完了）はイベントで通知
  @Output()
  readonly added = new EventEmitter<void>()
  @Output()
  readonly cancel = new EventEmitter<void>()

  // フォームのプロパティ
  // 登録処理
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AddComponent,
  ],
  template: `
    <app-add
      (cancel)="なにか処理"
      (added)="なにか処理"
    ></app-add>
  `,
})
export class AddDialogComponent {
  // イベントを受け取った後の処理に責務をもつ
  // ex ダイアログを閉じる
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AddComponent,
  ],
  template: `
    <app-add
      (cancel)="なにか処理"
      (added)="なにか処理"
    ></app-add>
  `,
})
export class AddPageComponent {
  // イベントを受け取った後の処理に責務をもつ
  // ex 別のページへ遷移する
}
```

書く場所が分かれるため、記述量が増えて非効率に感じるかもしれません。しかし責務が分かれてそれぞれのロジックも薄くなる分、ユニットテストも書きやすくなります。ここではテストの詳細や方針について掘り下げませんが、**テスト書きやすい＝保守しやすい**といっても過言ではないでしょう。


## まとめ


[Angular Advent Calendar 2023](https://qiita.com/advent-calendar/2023/angular) 21日目は[@ngsmvn](https://qiita.com/ngsmvn)さんです！
