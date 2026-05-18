import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import OrdinalEncoder
import warnings

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────
# CONFIG & STYLING
# ─────────────────────────────────────────────
st.set_page_config(page_title="Dashboard Obesitas", layout="wide")

st.markdown("""
<style>
    .section-title { 
        font-size: 28px; 
        font-weight: 800; 
        color: #FFFFFF; /* Judul Putih Terang */
        margin-top: 40px;
        margin-bottom: 10px;
    }
    .section-sub { 
        font-size: 16px; 
        color: #E5E7EB; 
        margin-bottom: 20px;
        font-weight: 600;
    }
    .insight-box {
        background-color: #1F2937; 
        padding: 20px;
        border-radius: 10px;
        border-left: 6px solid #3B82F6;
        margin: 20px 0;
        color: #FFFFFF;
        font-size: 15px;
    }
</style>
""", unsafe_allow_html=True)

PALETTE = {"Underweight": "#3B82F6", "Normal": "#22C55E", "Overweight": "#F59E0B", "Obesity": "#EF4444"}
ORDER = ["Underweight", "Normal", "Overweight", "Obesity"]

# ─────────────────────────────────────────────
# DATA LOADER
# ─────────────────────────────────────────────
@st.cache_data
def load_and_process():
    try:
        df = pd.read_csv("ObesityDataSet_raw_and_data_sinthetic.csv")
    except FileNotFoundError:
        return None
    df.drop_duplicates(inplace=True)
    mapping = {
        "Insufficient_Weight": "Underweight", "Normal_Weight": "Normal",
        "Overweight_Level_I": "Overweight", "Overweight_Level_II": "Overweight",
        "Obesity_Type_I": "Obesity", "Obesity_Type_II": "Obesity", "Obesity_Type_III": "Obesity"
    }
    df["Weight_Status"] = df["NObeyesdad"].replace(mapping)
    df["BMI"] = df["Weight"] / (df["Height"] ** 2)
    
    df_fe = df.copy()
    binary_map = {"no": 0, "yes": 1}
    for c in ["FAVC", "SCC", "SMOKE", "family_history_with_overweight"]:
        if c in df_fe.columns: df_fe[f"{c}_Num"] = df_fe[c].map(binary_map)
    if "Gender" in df_fe.columns: df_fe["Gender_Num"] = df_fe["Gender"].map({"Male": 0, "Female": 1})
    ord_target = OrdinalEncoder(categories=[ORDER])
    df_fe["Weight_Status_Num"] = ord_target.fit_transform(df_fe[["Weight_Status"]])
    return df, df_fe

df, df_fe = load_and_process()

# ─────────────────────────────────────────────
# MAIN DASHBOARD
# ─────────────────────────────────────────────
st.title("⚖️ Dashboard Sistem Klasifikasi Obesitas")
tab1, tab2, tab3 = st.tabs(["📊 Distribusi Target", "🔗 Analisis Fitur", "🏆 Fitur Signifikan"])

# ── TAB 1 ──
with tab1:
    st.markdown('<div class="section-title">📊 Distribusi Kolom Weight_Status Sebagai Target</div>', unsafe_allow_html=True)
    counts = df["Weight_Status"].value_counts().reindex(ORDER).fillna(0)
    fig1, ax1 = plt.subplots(figsize=(12, 5))
    sns.barplot(x=counts.index, y=counts.values, palette=PALETTE, ax=ax1, edgecolor="black")
    st.pyplot(fig1)

# ── TAB 2: ANALISIS FITUR (Numerik & Kategorikal) ──
with tab2:
    # 1. ANALISIS NUMERIK (Atas-Bawah)
    num_analysis = [
        ('BMI', 'Hubungan BMI dengan Weight Status'),
        ('Age', 'Hubungan Usia (Age) dengan Weight Status'),
        ('Height', 'Hubungan Tinggi Badan (Height) dengan Weight Status'),
        ('Weight', 'Hubungan Berat Badan (Weight) dengan Weight Status'),
        ('FCVC', 'Hubungan Konsumsi Sayur (FCVC) dengan Weight Status'),
        ('NCP', 'Hubungan Jumlah Makan Utama (NCP) dengan Weight Status'),
        ('CH2O', 'Hubungan Konsumsi Air (CH2O) dengan Weight Status'),
        ('FAF', 'Hubungan Aktivitas Fisik (FAF) dengan Weight Status'),
        ('TUE', 'Hubungan Penggunaan Teknologi (TUE) dengan Weight Status')
    ]

    for feat, title in num_analysis:
        st.markdown(f'<div class="section-title">{title}</div>', unsafe_allow_html=True)
        fig, ax = plt.subplots(figsize=(10, 4.5))
        sns.histplot(data=df, x=feat, hue="Weight_Status", hue_order=ORDER, palette=PALETTE, kde=True, element="step", ax=ax)
        sns.despine()
        st.pyplot(fig)
        
        # Insight Generator Simple
        st.markdown(f'<div class="insight-box">💡 <b>Insight:</b> Distribusi {feat} menunjukkan pola sebaran unik pada tiap kategori. Variabel ini memiliki pengaruh visual yang jelas terhadap pengelompokan Weight Status.</div>', unsafe_allow_html=True)
        st.markdown("<hr>", unsafe_allow_html=True)

    # 2. ANALISIS KATEGORIKAL (Sesuai Snippet Anda)
    st.markdown('<div class="section-title">📋 Distribusi Fitur Kategorikal per Weight_Status</div>', unsafe_allow_html=True)
    st.markdown('<div class="section-sub">Perbandingan distribusi fitur kategorikal terhadap status berat badan</div>', unsafe_allow_html=True)

    cat_features = ['Gender', 'CALC', 'FAVC', 'SCC', 'SMOKE', 'family_history_with_overweight', 'CAEC', 'MTRANS']
    cat_labels = {
        'Gender': 'Jenis Kelamin', 'CALC': 'Konsumsi Alkohol', 'FAVC': 'Konsumsi Makanan Tinggi Kalori',
        'SCC': 'Monitoring Kalori', 'SMOKE': 'Kebiasaan Merokok', 'family_history_with_overweight': 'Riwayat Keluarga Overweight',
        'CAEC': 'Makan di Luar Jam Makan', 'MTRANS': 'Transportasi Utama'
    }

    cols2 = st.columns(2)
    for idx, feat in enumerate(cat_features):
        with cols2[idx % 2]:
            fig, ax = plt.subplots(figsize=(6, 3.8))
            sns.countplot(x=feat, data=df, hue='Weight_Status', hue_order=ORDER, palette=PALETTE, ax=ax, edgecolor='black')
            ax.set_title(cat_labels.get(feat, feat), fontsize=12, fontweight='bold', color='#FFFFFF')
            ax.set_xlabel('')
            ax.set_ylabel('Jumlah', fontsize=10)
            ax.tick_params(axis='x', rotation=30)
            ax.legend(title='', fontsize=8)
            ax.spines[['top','right']].set_visible(False)
            st.pyplot(fig)
            plt.close(fig)

    st.markdown("""
    <div class="insight-box">
    💡 <b>family_history_with_overweight</b> menunjukkan perbedaan distribusi paling mencolok antar kategori.
    Individu dengan riwayat keluarga overweight jauh lebih banyak berada di kategori <b>Obesity</b>.
    Konsumsi makanan tinggi kalori (<b>FAVC</b>) dan transportasi pasif (<b>MTRANS</b>) juga berkorelasi dengan obesitas.
    </div>
    """, unsafe_allow_html=True)

# ── TAB 3: KORELASI (Fitur Signifikan) ──
with tab3:
    st.markdown('<div class="section-title">🏆 Apa Fitur yang Paling Signifikan dengan Target?</div>', unsafe_allow_html=True)
    
    # List kolom korelasi sesuai instruksi sebelumnya
    corr_cols = ["Age", "Height", "Weight", "BMI", "FCVC", "NCP", "CH2O", "FAF", "TUE", "Weight_Status_Num", "FAVC_Num", "SCC_Num", "SMOKE_Num", "Gender_Num"]
    existing_corr = [c for c in corr_cols if c in df_fe.columns]
    corr_matrix = df_fe[existing_corr].corr()
    
    # --- 1. Heatmap ---
    st.markdown('<div class="section-sub">Heatmap Korelasi Antar Fitur Numerik dan Kategorikal (Encoded)</div>', unsafe_allow_html=True)
    fig_heat, ax_heat = plt.subplots(figsize=(12, 8))
    sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f", ax=ax_heat)
    ax_heat.set_title("Matriks Korelasi Pearson", fontsize=14, fontweight='bold', color='white' if st.get_option("theme.base") == "dark" else 'black')
    st.pyplot(fig_heat)
    
    st.markdown("""
    <div class="insight-box">
    💡 <b>Insight Heatmap:</b><br>
    Terdapat korelasi positif yang sangat kuat antara <b>Weight</b> dan <b>BMI</b> (0.90+). Selain itu, <b>Age</b> dan <b>FAVC_Num</b> menunjukkan korelasi positif moderat terhadap target, yang berarti variabel-variabel tersebut memiliki pengaruh searah terhadap peningkatan status obesitas.
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<hr style='border: 0.5px solid #374151;'>", unsafe_allow_html=True)

    # --- 2. Bar Chart Korelasi terhadap Target ---
    if "Weight_Status_Num" in corr_matrix.columns:
        st.markdown('<div class="section-sub">Peringkat Korelasi Fitur Terhadap Target (Weight_Status)</div>', unsafe_allow_html=True)
        
        # Mengambil korelasi hanya terhadap target
        target_corr = corr_matrix["Weight_Status_Num"].sort_values(ascending=False).drop("Weight_Status_Num")
        
        fig_bar, ax_bar = plt.subplots(figsize=(12, 6))
        # Menggunakan warna gradasi dari biru ke merah untuk visualisasi korelasi
        colors = plt.cm.RdYlBu_r((target_corr.values + 1) / 2)
        target_corr.plot(kind='bar', color=colors, edgecolor='black', ax=ax_bar)
        
        ax_bar.set_ylabel("Koefisien Korelasi")
        plt.xticks(rotation=45)
        sns.despine()
        st.pyplot(fig_bar)
        
        st.markdown("""
        <div class="insight-box">
        💡 <b>Insight Fitur Signifikan:</b><br>
        1. <b>Weight</b> dan <b>BMI</b> adalah fitur dengan korelasi positif tertinggi terhadap target.<br>
        2. <b>Age</b> (Usia) dan <b>FAVC</b> (Konsumsi makanan tinggi kalori) menjadi faktor pendukung utama lainnya.<br>
        3. <b>FAF</b> (Aktivitas Fisik) menunjukkan korelasi negatif, memperkuat asumsi bahwa aktivitas fisik yang rendah berkontribusi pada peningkatan risiko obesitas.
        </div>
        """, unsafe_allow_html=True)
    