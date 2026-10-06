import { Field, FieldLabel } from '~/components/ui/field.tsx'
import { Input } from '~/components/ui/input.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import { CharCount, FieldGrid, FieldMessage, FormSection, SwitchField } from '../form-parts.tsx'
import type { DialogFormState } from './notice-form.ts'

export function NoticeDialogFields({
  form,
  errors,
  update,
}: {
  form: DialogFormState
  errors: Record<string, string>
  update: (patch: Partial<DialogFormState>) => void
}) {
  return (
    <>
      <FormSection title="公告内容">
        <Field invalid={Boolean(errors.title)}>
          <FieldLabel>标题</FieldLabel>
          <Input
            maxLength={50}
            onValueChange={(value) => update({ title: value })}
            placeholder="请输入公告标题"
            value={form.title}
          />
          <CharCount max={50} value={form.title} />
          <FieldMessage error={errors.title} />
        </Field>
        <Field invalid={Boolean(errors.content)}>
          <FieldLabel>内容</FieldLabel>
          <Textarea
            maxLength={1000}
            onChange={(event) => update({ content: event.target.value })}
            placeholder="请输入公告内容，支持换行"
            rows={6}
            value={form.content}
          />
          <CharCount max={1000} value={form.content} />
          <FieldMessage error={errors.content} />
        </Field>
      </FormSection>

      <FormSection title="弹窗按钮">
        <FieldGrid>
          <Field invalid={Boolean(errors.cancelBtn)}>
            <FieldLabel>取消按钮文字</FieldLabel>
            <Input maxLength={10} onValueChange={(value) => update({ cancelBtn: value })} value={form.cancelBtn} />
            <FieldMessage error={errors.cancelBtn} />
          </Field>
          <Field invalid={Boolean(errors.confirmBtn)}>
            <FieldLabel>确认按钮文字</FieldLabel>
            <Input maxLength={10} onValueChange={(value) => update({ confirmBtn: value })} value={form.confirmBtn} />
            <FieldMessage error={errors.confirmBtn} />
          </Field>
        </FieldGrid>
      </FormSection>

      <FormSection title="交互行为">
        <SwitchField
          checked={form.showOverlay}
          description="弹窗背后显示半透明遮罩"
          label="显示遮罩层"
          onCheckedChange={(checked) => update({ showOverlay: checked })}
        />
        <SwitchField
          checked={form.closeOnOverlayClick}
          description="点击弹窗外遮罩时关闭弹窗"
          label="点击遮罩关闭"
          onCheckedChange={(checked) => update({ closeOnOverlayClick: checked })}
        />
        <SwitchField
          checked={form.preventScrollThrough}
          description="弹窗打开时锁定页面滚动"
          label="阻止背景滚动"
          onCheckedChange={(checked) => update({ preventScrollThrough: checked })}
        />
      </FormSection>

      <FormSection title="高级设置">
        <FieldGrid>
          <Field invalid={Boolean(errors.zIndex)}>
            <FieldLabel>弹窗层级 zIndex</FieldLabel>
            <Input
              inputMode="numeric"
              onValueChange={(value) => update({ zIndex: value })}
              type="number"
              value={form.zIndex}
            />
            <FieldMessage error={errors.zIndex} />
          </Field>
          <Field invalid={Boolean(errors.overlayZIndex)}>
            <FieldLabel>遮罩层级 zIndex</FieldLabel>
            <Input
              inputMode="numeric"
              onValueChange={(value) => update({ overlayZIndex: value })}
              placeholder="默认 11000"
              type="number"
              value={form.overlayZIndex}
            />
            <FieldMessage error={errors.overlayZIndex} />
          </Field>
        </FieldGrid>
        <FieldGrid>
          <Field invalid={Boolean(errors.overlayDuration)}>
            <FieldLabel>遮罩动画时长（毫秒）</FieldLabel>
            <Input
              inputMode="numeric"
              onValueChange={(value) => update({ overlayDuration: value })}
              placeholder="默认 300"
              type="number"
              value={form.overlayDuration}
            />
            <FieldMessage error={errors.overlayDuration} />
          </Field>
          <Field invalid={Boolean(errors.overlayBackgroundColor)}>
            <FieldLabel>遮罩背景色</FieldLabel>
            <Input
              maxLength={50}
              onValueChange={(value) => update({ overlayBackgroundColor: value })}
              placeholder="如 rgba(0, 0, 0, 0.6)"
              value={form.overlayBackgroundColor}
            />
            <FieldMessage error={errors.overlayBackgroundColor} />
          </Field>
        </FieldGrid>
        <SwitchField
          checked={form.overlayPreventScrollThrough}
          description="透传至 Overlay 组件的 preventScrollThrough 参数，默认开启"
          label="遮罩阻止滚动"
          onCheckedChange={(checked) => update({ overlayPreventScrollThrough: checked })}
        />
        <SwitchField
          checked={form.overlayUsingCustomNavbar}
          description="透传至 Overlay 组件的 usingCustomNavbar 参数，默认关闭"
          label="使用自定义导航栏"
          onCheckedChange={(checked) => update({ overlayUsingCustomNavbar: checked })}
        />
      </FormSection>
    </>
  )
}
