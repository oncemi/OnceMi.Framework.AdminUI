<template>
  <a-card :title="pageTitle" :loading="pageLoading">
    <a-spin tip="保存中..." :spinning="loading">
      <a-row>
        <a-col :span="12">
          <a-form :form="formArticleBasic" v-bind="formLayout">
            <a-form-item label="标题">
              <a-input
                v-decorator="['title', { rules: [{ required: true, message: '请输入文章标题' }] }]"
                placeholder="添加标题"
              />
            </a-form-item>
            <a-form-item label="分类" :required="true">
              <a-tree-select
                v-model="articleCategorySelect"
                placeholder="添加分类"
                :tree-data="articleCategoryTreeData"
                :treeCheckable="true"
                :allowClear="true"
                :dropdownMatchSelectWidth="true"
                :getPopupContainer="getPopupContainer"
                :showCheckedStrategy="SHOW_ALL"
                :treeDefaultExpandAll="true"
                :treeCheckStrictly="true"
                :replaceFields="{ children: 'children', title: 'name', value: 'id' }"
                @change="onArticleCategorySelected"
              />
            </a-form-item>
            <a-form-item label="标签">
              <a-select mode="tags" placeholder="添加标签" v-model="articleTagsSelect">
                <a-select-option v-for="item in articleTagsSelectList" :key="item.value">
                  {{ item.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </a-col>
        <a-col :span="12" style="text-align: right; margin-top: 3px">
          <a-space>
            <a-button icon="save" @click="handleSubmit(true)">保存草稿</a-button>
            <a-button type="primary" icon="check" @click="handleSubmit(false)" style="width: 110px">发布</a-button>
          </a-space>
        </a-col>
      </a-row>
      <a-row>
        <div class="tinymce">
          <editor id="tinymce" v-model="data" :init="init"></editor>
        </div>
      </a-row>
      <a-row>
        <a-divider orientation="left"> 文章设置 </a-divider>
        <a-col :span="12">
          <a-form :form="formArticleSetting" v-bind="formLayout">
            <a-form-item label="评论开关">
              <a-checkbox
                v-decorator="[
                  'isAllowComment',
                  {
                    valuePropName: 'checked',
                    initialValue: true,
                  },
                ]"
              >
                是否允许评论
              </a-checkbox>
            </a-form-item>
            <a-form-item label="置顶开关">
              <a-checkbox
                v-decorator="[
                  'isTop',
                  {
                    valuePropName: 'checked',
                    initialValue: false,
                  },
                ]"
              >
                是否置顶
              </a-checkbox>
            </a-form-item>
            <a-form-item label="封面">
              <a-upload
                name="avatar"
                list-type="picture-card"
                class="avatar-uploader"
                :show-upload-list="false"
                :customRequest="doCoverUpload"
                accept=".tif,.jpg,.jpeg,.png,.jfif,.gif"
                :before-upload="beforeCoverUpload"
                @change="handleCoverUpload"
              >
                <img v-if="coverImageData && coverImageData.url" :src="coverImageData.url" alt="avatar" />
                <div v-else>
                  <a-icon :type="coverLoading ? 'loading' : 'plus'" />
                  <div class="ant-upload-text">上传封面</div>
                </div>
              </a-upload>
            </a-form-item>
            <a-form-item label="副标题">
              <a-input v-decorator="['subTitle', { rules: [{ required: false }] }]" placeholder="添加文章副标题" />
            </a-form-item>
            <a-form-item label="摘要">
              <a-textarea
                v-decorator="['summary', { rules: [{ required: false }] }]"
                placeholder="文章摘要"
                :auto-size="{ minRows: 3, maxRows: 6 }"
              />
            </a-form-item>
          </a-form>
        </a-col>
        <a-col :span="12">
          <!-- 这里也不是不可以放点什么 -->
        </a-col>
      </a-row>
    </a-spin>
  </a-card>
</template>

<script>
import tinymce from "tinymce/tinymce";
import Editor from "@tinymce/tinymce-vue";
import "tinymce/themes/silver/theme";
import "tinymce/icons/default/icons";
//插件
import "tinymce/plugins/advlist";
import "tinymce/plugins/anchor";
import "tinymce/plugins/autolink";
import "tinymce/plugins/autosave";
import "tinymce/plugins/bbcode";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/codesample";
import "tinymce/plugins/colorpicker";
import "tinymce/plugins/contextmenu";
import "tinymce/plugins/directionality";
import "tinymce/plugins/fullpage";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/help";
import "tinymce/plugins/hr";
import "tinymce/plugins/image";
import "tinymce/plugins/imagetools";
import "tinymce/plugins/importcss";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/legacyoutput";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/nonbreaking";
import "tinymce/plugins/noneditable";
import "tinymce/plugins/pagebreak";
//import "tinymce/plugins/paste"; //使用了powerpaste插件
import "tinymce/plugins/preview";
import "tinymce/plugins/print";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/save";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/spellchecker";
import "tinymce/plugins/tabfocus";
import "tinymce/plugins/table";
import "tinymce/plugins/template";
import "tinymce/plugins/textcolor";
import "tinymce/plugins/textpattern";
import "tinymce/plugins/toc";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/visualchars";
import "tinymce/plugins/wordcount";

import {
  POST_FILE_ITEM,
  DELETE_FILE_ITEM,
  GET_ARTICLECATEGORY_CASCADER,
  GET_ARTICLE_TAGS_SELECTLIST,
  GET_ARTICLE_ITEM,
  POST_PUT_ARTICLE_ITEM,
} from "@/services/api";
import { request, METHOD } from "@/utils/request";
import { v4 as uuidv4 } from "uuid";
import { TreeSelect } from "ant-design-vue";
import { getQueryString } from "@/utils/util";

const SHOW_ALL = TreeSelect.SHOW_PARENT;

export default {
  name: "ArticleEdit",
  components: { Editor },
  data() {
    return {
      formLayout: {
        labelCol: {
          xs: { span: 24 },
          sm: { span: 6 },
          md: { span: 5 },
          lg: { span: 5 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 18 },
          md: { span: 18 },
          lg: { span: 14 },
        },
      },
      SHOW_ALL,
      loading: false,
      pageTitle: "新建文章",
      pageLoading: false,
      formArticleBasic: this.$form.createForm(this, { name: "articleBasic" }),
      formArticleSetting: this.$form.createForm(this, { name: "articleSetting" }),
      //category tree data
      articleCategorySelect: [],
      articleCategoryTreeData: [],
      //tags
      articleTagsSelectList: [],
      articleTagsSelect: [],
      //封面上传
      coverLoading: false,
      coverImageData: {
        url: null,
      },
      //文章内容
      data: "",
      //文章Id
      articleId: 0,
      //富文本编辑器
      init: {
        external_plugins: {
          powerpaste: `/tinymce/plugins/powerpaste/plugin.min.js`,
          attachment: `/tinymce/plugins/attachment/plugin.min.js`,
        },
        language_url: "/tinymce/langs/zh_CN.js",
        language: "zh_CN",
        skin_url: "/tinymce/skins/ui/oxide",
        content_css: "/tinymce/skins/content/document/content.css",
        height: 700,
        plugins:
          "powerpaste print preview searchreplace autolink directionality visualblocks visualchars \
          fullscreen image link media template code codesample table charmap hr pagebreak \
          nonbreaking anchor insertdatetime advlist lists wordcount imagetools textpattern help autosave attachment",
        toolbar:
          "undo redo restoredraft fullscreen | styleselect | cut copy paste pastetext | \
          forecolor backcolor bold italic underline strikethrough link anchor code table | \
          alignleft aligncenter alignright alignjustify outdent indent lineheight | attachment image media |\
          formatselect fontselect fontsizeselect | bullist numlist | blockquote subscript superscript removeformat | \
          charmap hr pagebreak insertdatetime print preview",
        branding: false,
        paste_data_images: true, //粘贴图片
        //文件上传参数设置
        attachment_max_size: 2048 * 1024 * 1024, //2G
        attachment_assets_path: "/tinymce/plugins/attachment/assets/icons/",
        images_upload_handler: function (file, successCallback, failureCallback) {
          let fileName = file.filename();
          if (!fileName) {
            fileName = uuidv4() + ".jpg";
          }
          let fileOfBlob = new File([file.blob()], fileName);
          let param = new FormData();
          param.append("file", fileOfBlob);
          param.append("AccessMode", "PublicRead");
          let config = {
            headers: { "Content-Type": "multipart/form-data" },
          };
          request(POST_FILE_ITEM, METHOD.POST, param, config)
            .then((result) => {
              if (result.data.code != 0) {
                failureCallback(result.data.message);
                return;
              }
              if (!result.data.data || result.data.data.length == 0) {
                failureCallback("图片上传失败");
                return;
              }
              successCallback(result.data.data[0].url);
            })
            .catch((error) => {
              failureCallback("图片上传失败, " + error.message);
              console.error(error);
            });
        },
        attachment_upload_handler: function (file, successCallback, failureCallback) {
          let param = new FormData();
          param.append("file", file);
          param.append("AccessMode", "PublicRead");
          let config = {
            headers: { "Content-Type": "multipart/form-data" },
          };
          request(POST_FILE_ITEM, METHOD.POST, param, config)
            .then((result) => {
              if (result.data.code != 0) {
                failureCallback(result.data.message);
                return;
              }
              if (!result.data.data || result.data.data.length == 0) {
                failureCallback("图片上传失败");
                return;
              }
              successCallback(result.data.data[0].url);
            })
            .catch((error) => {
              failureCallback("图片上传失败, " + error.message);
              console.error(error);
            });
        },
      },
    };
  },
  mounted() {
    tinymce.init({});
    this.load();
  },
  methods: {
    async load() {
      //form刷新
      ["title"].forEach((v) => this.formArticleBasic.getFieldDecorator(v));
      ["isAllowComment", "isTop", "subTitle", "summary"].forEach((v) => this.formArticleSetting.getFieldDecorator(v));
      //加载数据
      this.articleCategoryTreeData = [];
      this.pageLoading = true;
      this.articleId = getQueryString("articleId", window.location.href);

      //加载分类
      request(GET_ARTICLECATEGORY_CASCADER, METHOD.GET).then((categoryResult) => {
        if (categoryResult.data.code != 0) {
          return;
        }
        this.articleCategoryTreeData = categoryResult.data.data;
        //加载Tag
        request(GET_ARTICLE_TAGS_SELECTLIST, METHOD.GET).then((tagsResult) => {
          if (tagsResult.data.code != 0) {
            return;
          }
          this.articleTagsSelectList.splice(0);
          tagsResult.data.data.forEach((r) => {
            this.articleTagsSelectList.push(r);
          });

          if (this.articleId && this.articleId > 0) {
            this.pageTitle = "编辑文章";
            //获取文章信息
            request(`${GET_ARTICLE_ITEM}/${this.articleId}`, METHOD.GET).then((result) => {
              if (result.data.code != 0) {
                return;
              }
              //加载基础表单数据
              this.formArticleBasic.setFieldsValue({
                title: result.data.data.title,
              });
              //tag
              if (result.data.data.tags && result.data.data.tags.length > 0) {
                for (let i = 0; i < result.data.data.tags.length; i++) {
                  this.articleTagsSelect.push(result.data.data.tags[i].tag);
                }
              }
              //分类
              if (result.data.data.categories && result.data.data.categories.length > 0) {
                for (let i = 0; i < result.data.data.categories.length; i++) {
                  this.articleCategorySelect.push({
                    label: result.data.data.categories[i].label,
                    value: result.data.data.categories[i].id,
                  });
                }
              }
              //加载设置表单数据
              this.formArticleSetting.setFieldsValue({
                isAllowComment: result.data.data.isAllowComment,
                isTop: result.data.data.isTop,
                subTitle: result.data.data.subtitle,
                summary: result.data.data.summary,
              });
              //文章内容
              this.data = result.data.data.content;
              //封面图片
              if (result.data.data.covers && result.data.data.covers.length > 0) {
                this.coverImageData = result.data.data.covers[0];
              }

              this.pageLoading = false;
            });
          } else {
            this.pageLoading = false;
          }
        });
      });
    },
    getPopupContainer(triggerNode) {
      return triggerNode.parentNode;
    },
    onArticleCategorySelected(value, node, extra) {
      //console.log(JSON.stringify(this.organizeSelect));
    },
    handleSubmit(isDraft) {
      this.formArticleBasic.validateFields((basicErr, basicVal) => {
        if (basicErr) {
          return;
        }
        this.formArticleSetting.validateFields((settingErr, settingVal) => {
          if (settingErr) {
            return;
          }
          let data = {
            Id: this.articleId,
            IsDraft: isDraft,
            Tags: [],
            Categories: [],
            Title: basicVal.title,
            SubTitle: settingVal.subTitle ?? "",
            Content: this.data ?? "",
            IsAllowComment: settingVal.isAllowComment,
            IsTop: settingVal.isTop,
            Summary: settingVal.summary ?? "",
            Covers: [],
          };
          //标签
          if (this.articleTagsSelect && this.articleTagsSelect.length > 0) {
            for (let i = 0; i < this.articleTagsSelect.length; i++) {
              data.Tags.push(this.articleTagsSelect[i]);
            }
          }
          //分类
          if (this.articleCategorySelect && this.articleCategorySelect.length > 0) {
            for (let i = 0; i < this.articleCategorySelect.length; i++) {
              data.Categories.push(this.articleCategorySelect[i].value);
            }
          } else {
            this.$message.warning("文章分类不能为空");
            return;
          }
          //封面
          if (this.coverImageData.url) {
            data.Covers.push(this.coverImageData.url);
          }
          let method = this.articleId && this.articleId > 0 ? METHOD.PUT : METHOD.POST;
          this.loading = true;
          request(POST_PUT_ARTICLE_ITEM, method, data)
            .then((result) => {
              this.loading = false;
              if (result.data.code != 0) {
                return;
              }
              if (method == METHOD.POST) {
                //新建的话会传回文章Id
                this.articleId = result.data.data.id;
              }
              let self = this;
              if (data.IsDraft) {
                this.$message.success("草稿已保存");
              } else {
                //this.$message.success("文章已发布");
                this.$confirm({
                  title: "发布成功，是否关闭当前标签页？",
                  onOk() {
                    self.$closePage("/articles/articleEdit", "/articles/articleList");
                  },
                  onCancel() {},
                });
              }
            })
            .catch((error) => {
              this.loading = false;
              console.error(error);
            });
        });
      });
    },
    doCoverUpload(data) {
      let param = new FormData();
      param.append("file", data.file);
      param.append("AccessMode", "PublicRead");
      let config = {
        headers: { "Content-Type": "multipart/form-data" },
      };
      request(POST_FILE_ITEM, METHOD.POST, param, config)
        .then((result) => {
          if (result.data.code != 0) {
            data.onError(new Error(result.data.message), result.data);
            return;
          }
          data.onSuccess(result.data, data.file);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    handleCoverUpload(info) {
      if (info.file.status === "error") {
        this.coverLoading = false;
        return;
      }
      if (info.file.status === "uploading") {
        this.coverLoading = true;
        return;
      }
      if (info.file.status === "done") {
        if (!info.file.response.data || info.file.response.data.length == 0) {
          this.$message.warning("图片已上传，但返回内容为空");
          this.coverLoading = false;
          return;
        }
        this.coverImageData = info.file.response.data[0];
        this.coverLoading = false;
      }
    },
    beforeCoverUpload(file) {
      if (this.coverImageData) {
        let id = this.coverImageData.id;
        this.coverImageData = {
          url: null,
        };
        if (id && id > 0) {
          //删除之前上传的
          request(DELETE_FILE_ITEM, METHOD.DELETE, [id]).then((result) => {
            if (result.data.code != 0) {
              return;
            }
          });
        }
      }
      const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        this.$message.warning("只能上传图片文件");
      }
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        this.$message.warning("封面图片不能大于10MB");
      }
      return isJpgOrPng && isLt2M;
    },
    searchSelectItem(source, idArgs, dest) {
      if (!source || source.length == 0) {
        dest = [];
      }
      for (let i = 0; i < source.length; i++) {
        if (idArgs.indexOf(source[i].id) >= 0) {
          dest.push({ value: source[i].id, title: source[i].name });
        }
        if (source[i].children && source[i].children.length > 0) {
          this.searchSelectItem(source[i].children, idArgs, dest);
        }
      }
    },
  },
};
</script>

<style scoped lang="less">
/deep/ .ant-form-item {
  margin-bottom: 12px;
}

.avatar-uploader > .ant-upload {
  width: 128px;
  height: 128px;
}
.avatar-uploader > .ant-upload img {
  width: 86px;
  height: 86px;
}
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
